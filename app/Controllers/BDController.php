<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\BD;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Services\CouponService;
use EposAffiliate\Services\EmailService;
use WP_REST_Request;
use WP_REST_Response;

class BDController {

    public static function index( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'reseller_id' ) ) {
            $args['reseller_id'] = $request->get_param( 'reseller_id' );
        }
        if ( $request->get_param( 'status' ) ) {
            $args['status'] = $request->get_param( 'status' );
        }

        return new WP_REST_Response( BD::all( $args ), 200 );
    }

    public static function show( WP_REST_Request $request ) {
        $bd = BD::find( $request->get_param( 'id' ) );

        if ( ! $bd ) {
            return new WP_REST_Response( [ 'message' => 'BD not found.' ], 404 );
        }

        return new WP_REST_Response( $bd, 200 );
    }

    public static function store( WP_REST_Request $request ) {
        $name        = sanitize_text_field( $request->get_param( 'name' ) );
        $email       = sanitize_email( $request->get_param( 'email' ) );
        $reseller_id = absint( $request->get_param( 'reseller_id' ) );

        if ( ! $name || ! $reseller_id ) {
            return new WP_REST_Response( [ 'message' => 'Name and reseller are required.' ], 400 );
        }

        $reseller = Reseller::find( $reseller_id );
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        // Auto-generate tracking code: [RESELLER_CODE]-[NNN] (e.g., EPOS-01-001).
        $tracking_code = BD::generate_tracking_code( $reseller_id, $reseller->slug );

        // Create WP user for the BD.
        $wp_user_id = null;
        if ( $email ) {
            if ( email_exists( $email ) ) {
                return new WP_REST_Response( [ 'message' => 'Email already exists.' ], 400 );
            }

            $username = sanitize_user( strtolower( $tracking_code ) );
            $password = wp_generate_password( 12 );

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
        }

        // Create BD record.
        $bd_id = BD::create( [
            'reseller_id'   => $reseller_id,
            'wp_user_id'    => $wp_user_id,
            'name'          => $name,
            'tracking_code' => $tracking_code,
        ] );

        if ( ! $bd_id ) {
            return new WP_REST_Response( [ 'message' => 'Failed to create BD.' ], 500 );
        }

        // Create WooCommerce tracking coupon.
        CouponService::create_tracking_coupon( $tracking_code, $wp_user_id, $reseller_id );

        return new WP_REST_Response( BD::find( $bd_id ), 201 );
    }

    public static function update( WP_REST_Request $request ) {
        $id = $request->get_param( 'id' );
        $bd = BD::find( $id );

        if ( ! $bd ) {
            return new WP_REST_Response( [ 'message' => 'BD not found.' ], 404 );
        }

        $data = [];
        if ( $request->get_param( 'name' ) )   $data['name']   = $request->get_param( 'name' );
        if ( $request->get_param( 'status' ) ) $data['status'] = $request->get_param( 'status' );

        BD::update( $id, $data );

        return new WP_REST_Response( BD::find( $id ), 200 );
    }

    /**
     * GET /bds/next-code?reseller_id=1 — Preview the next BD tracking code.
     */
    public static function preview_code( WP_REST_Request $request ) {
        $reseller_id = absint( $request->get_param( 'reseller_id' ) );

        if ( ! $reseller_id ) {
            return new WP_REST_Response( [ 'message' => 'Reseller ID is required.' ], 400 );
        }

        $reseller = Reseller::find( $reseller_id );
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        $code = BD::generate_tracking_code( $reseller_id, $reseller->slug );

        return new WP_REST_Response( [ 'code' => $code ], 200 );
    }

    public static function destroy( WP_REST_Request $request ) {
        $id = $request->get_param( 'id' );
        $bd = BD::find( $id );

        if ( ! $bd ) {
            return new WP_REST_Response( [ 'message' => 'BD not found.' ], 404 );
        }

        BD::deactivate( $id );

        // Disable the tracking coupon.
        CouponService::disable_coupon( $bd->tracking_code );

        return new WP_REST_Response( [ 'message' => 'BD deactivated.' ], 200 );
    }
}
