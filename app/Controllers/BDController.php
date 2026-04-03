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
        $bd_code     = strtoupper( sanitize_text_field( $request->get_param( 'bd_code' ) ) );

        if ( ! $name || ! $reseller_id || ! $bd_code ) {
            return new WP_REST_Response( [ 'message' => 'Name, reseller, and BD code are required.' ], 400 );
        }

        $reseller = Reseller::find( $reseller_id );
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        // Build tracking code: BD-[RESELLER_SLUG]-[BD_CODE]
        $tracking_code = 'BD-' . strtoupper( $reseller->slug ) . '-' . $bd_code;

        // Check uniqueness.
        if ( BD::find_by_tracking_code( $tracking_code ) ) {
            return new WP_REST_Response( [ 'message' => 'Tracking code already exists.' ], 400 );
        }

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
