<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\BD;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Services\CouponService;
use EposAffiliate\Services\EmailService;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Reseller-scoped BD management.
 * All operations are restricted to the logged-in reseller's own BDs.
 */
class ResellerBDController {

    /**
     * GET /my/bds — List BDs for the current reseller.
     */
    public static function index( WP_REST_Request $request ) {
        $reseller = self::get_reseller();
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 403 );
        }

        $bds = BD::all( [ 'reseller_id' => $reseller->id ] );

        return new WP_REST_Response( $bds, 200 );
    }

    /**
     * POST /my/bds — Create a BD under the current reseller.
     */
    public static function store( WP_REST_Request $request ) {
        $reseller = self::get_reseller();
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 403 );
        }

        $name  = sanitize_text_field( $request->get_param( 'name' ) );
        $email = sanitize_email( $request->get_param( 'email' ) );

        if ( ! $name ) {
            return new WP_REST_Response( [ 'message' => 'Name is required.' ], 400 );
        }

        if ( ! $email ) {
            return new WP_REST_Response( [ 'message' => 'Email is required.' ], 400 );
        }

        // Auto-generate tracking code: [RESELLER_CODE]-[NNN] (e.g., EPOS-01-001).
        $tracking_code = BD::generate_tracking_code( $reseller->id, $reseller->slug );

        if ( email_exists( $email ) ) {
            return new WP_REST_Response( [ 'message' => 'Email already in use.' ], 400 );
        }

        // Create WP user.
        $username   = sanitize_user( strtolower( $tracking_code ) );
        $password   = wp_generate_password( 12 );
        $wp_user_id = wp_insert_user( [
            'user_login'   => $username,
            'user_email'   => $email,
            'user_pass'    => $password,
            'role'         => 'bd_agent',
            'display_name' => $name,
        ] );

        if ( is_wp_error( $wp_user_id ) ) {
            return new WP_REST_Response( [ 'message' => $wp_user_id->get_error_message() ], 400 );
        }

        EmailService::send_bd_welcome( $wp_user_id, $name, $password, $reseller->name );

        // Create BD record.
        $bd_id = BD::create( [
            'reseller_id'   => $reseller->id,
            'wp_user_id'    => $wp_user_id,
            'name'          => $name,
            'tracking_code' => $tracking_code,
        ] );

        if ( ! $bd_id ) {
            return new WP_REST_Response( [ 'message' => 'Failed to create BD.' ], 500 );
        }

        // Create WooCommerce tracking coupon.
        CouponService::create_tracking_coupon( $tracking_code, $wp_user_id, $reseller->id );

        return new WP_REST_Response( BD::find( $bd_id ), 201 );
    }

    /**
     * PUT /my/bds/{id} — Update a BD (name only).
     */
    public static function update( WP_REST_Request $request ) {
        $reseller = self::get_reseller();
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 403 );
        }

        $id = absint( $request->get_param( 'id' ) );
        $bd = BD::find( $id );

        if ( ! $bd || (int) $bd->reseller_id !== (int) $reseller->id ) {
            return new WP_REST_Response( [ 'message' => 'BD not found.' ], 404 );
        }

        $data = [];
        if ( $request->get_param( 'name' ) ) {
            $data['name'] = sanitize_text_field( $request->get_param( 'name' ) );
        }
        if ( $request->get_param( 'status' ) ) {
            $status = sanitize_text_field( $request->get_param( 'status' ) );
            if ( in_array( $status, [ 'active', 'inactive' ], true ) ) {
                $data['status'] = $status;
            }
        }

        if ( ! empty( $data ) ) {
            BD::update( $id, $data );
        }

        return new WP_REST_Response( BD::find( $id ), 200 );
    }

    /**
     * DELETE /my/bds/{id} — Deactivate a BD.
     */
    public static function destroy( WP_REST_Request $request ) {
        $reseller = self::get_reseller();
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 403 );
        }

        $id = absint( $request->get_param( 'id' ) );
        $bd = BD::find( $id );

        if ( ! $bd || (int) $bd->reseller_id !== (int) $reseller->id ) {
            return new WP_REST_Response( [ 'message' => 'BD not found.' ], 404 );
        }

        BD::deactivate( $id );
        CouponService::disable_coupon( $bd->tracking_code );

        return new WP_REST_Response( [ 'message' => 'BD deactivated.' ], 200 );
    }

    /**
     * Get the reseller record for the current user.
     */
    private static function get_reseller() {
        $user = wp_get_current_user();

        if ( in_array( 'administrator', $user->roles, true ) ) {
            $all = Reseller::all();
            return $all[0] ?? null;
        }

        return Reseller::find_by_user_id( $user->ID );
    }
}
