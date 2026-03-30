<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\BD;
use EposAffiliate\Services\CouponService;
use WP_REST_Request;
use WP_REST_Response;

class ResellerController {

    public static function index( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'status' ) ) {
            $args['status'] = $request->get_param( 'status' );
        }

        return new WP_REST_Response( Reseller::all( $args ), 200 );
    }

    public static function show( WP_REST_Request $request ) {
        $reseller = Reseller::find( $request->get_param( 'id' ) );

        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        return new WP_REST_Response( $reseller, 200 );
    }

    public static function store( WP_REST_Request $request ) {
        $name  = sanitize_text_field( $request->get_param( 'name' ) );
        $slug  = sanitize_title( $request->get_param( 'slug' ) );
        $email = sanitize_email( $request->get_param( 'email' ) );

        if ( ! $name || ! $slug ) {
            return new WP_REST_Response( [ 'message' => 'Name and slug are required.' ], 400 );
        }

        // Create WP user for the reseller manager.
        $wp_user_id = null;
        if ( $email ) {
            if ( email_exists( $email ) ) {
                return new WP_REST_Response( [ 'message' => 'Email already exists.' ], 400 );
            }

            $username = sanitize_user( $slug );
            $password = wp_generate_password( 12 );

            $wp_user_id = wp_insert_user( [
                'user_login' => $username,
                'user_email' => $email,
                'user_pass'  => $password,
                'role'       => 'reseller_manager',
                'display_name' => $name,
            ] );

            if ( is_wp_error( $wp_user_id ) ) {
                return new WP_REST_Response( [ 'message' => $wp_user_id->get_error_message() ], 400 );
            }

            // Send credentials email.
            wp_new_user_notification( $wp_user_id, null, 'user' );
        }

        $id = Reseller::create( [
            'name'       => $name,
            'slug'       => $slug,
            'wp_user_id' => $wp_user_id,
        ] );

        if ( ! $id ) {
            return new WP_REST_Response( [ 'message' => 'Failed to create reseller.' ], 500 );
        }

        // Auto-create a BD record for the Reseller so they can also use QR tracking.
        if ( $wp_user_id ) {
            $bd_code       = strtoupper( $slug );
            $tracking_code = 'BD-' . $bd_code . '-OWNER';

            // Only create if not already existing.
            if ( ! BD::find_by_tracking_code( $tracking_code ) ) {
                $bd_id = BD::create( [
                    'reseller_id'   => $id,
                    'wp_user_id'    => $wp_user_id,
                    'name'          => $name,
                    'tracking_code' => $tracking_code,
                ] );

                if ( $bd_id ) {
                    CouponService::create_tracking_coupon( $tracking_code, $wp_user_id, $id );
                }
            }
        }

        return new WP_REST_Response( Reseller::find( $id ), 201 );
    }

    public static function update( WP_REST_Request $request ) {
        $id = $request->get_param( 'id' );

        if ( ! Reseller::find( $id ) ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        $data = [];
        if ( $request->get_param( 'name' ) )   $data['name']   = $request->get_param( 'name' );
        if ( $request->get_param( 'slug' ) )   $data['slug']   = $request->get_param( 'slug' );
        if ( $request->get_param( 'status' ) ) $data['status'] = $request->get_param( 'status' );

        Reseller::update( $id, $data );

        return new WP_REST_Response( Reseller::find( $id ), 200 );
    }

    public static function destroy( WP_REST_Request $request ) {
        $id = $request->get_param( 'id' );

        if ( ! Reseller::find( $id ) ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        Reseller::deactivate( $id );

        return new WP_REST_Response( [ 'message' => 'Reseller deactivated.' ], 200 );
    }
}
