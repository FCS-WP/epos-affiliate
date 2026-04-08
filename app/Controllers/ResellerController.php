<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\BD;
use EposAffiliate\Services\CouponService;
use EposAffiliate\Services\EmailService;
use WP_REST_Request;
use WP_REST_Response;

class ResellerController {

    public static function index( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'status' ) ) {
            $args['status'] = $request->get_param( 'status' );
        }

        $resellers = Reseller::all( $args );

        // Enrich each reseller with email and QR data.
        foreach ( $resellers as $reseller ) {
            self::enrich_reseller( $reseller );
        }

        return new WP_REST_Response( $resellers, 200 );
    }

    public static function show( WP_REST_Request $request ) {
        $reseller = Reseller::find( $request->get_param( 'id' ) );

        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        self::enrich_reseller( $reseller );

        return new WP_REST_Response( $reseller, 200 );
    }

    public static function store( WP_REST_Request $request ) {
        $name   = sanitize_text_field( $request->get_param( 'name' ) );
        $prefix = strtoupper( preg_replace( '/[^A-Za-z0-9]/', '', sanitize_text_field( $request->get_param( 'prefix' ) ) ) );
        $email  = sanitize_email( $request->get_param( 'email' ) );

        if ( ! $name || ! $prefix ) {
            return new WP_REST_Response( [ 'message' => 'Name and prefix are required.' ], 400 );
        }

        // Generate reseller code: PREFIX-NN (e.g., EPOS-01).
        $slug = Reseller::generate_code( $prefix );

        // Create WP user for the reseller manager.
        $wp_user_id = null;
        if ( $email ) {
            if ( email_exists( $email ) ) {
                return new WP_REST_Response( [ 'message' => 'Email already exists.' ], 400 );
            }

            $username = sanitize_user( strtolower( $slug ) );
            $password = wp_generate_password( 12 );

            $wp_user_id = wp_insert_user( [
                'user_login'   => $username,
                'user_email'   => $email,
                'user_pass'    => $password,
                'role'         => 'reseller_manager',
                'display_name' => $name,
            ] );

            if ( is_wp_error( $wp_user_id ) ) {
                return new WP_REST_Response( [ 'message' => $wp_user_id->get_error_message() ], 400 );
            }

            EmailService::send_reseller_welcome( $wp_user_id, $name, $password );
        }

        $id = Reseller::create( [
            'name'       => $name,
            'slug'       => $slug,
            'wp_user_id' => $wp_user_id,
        ] );

        if ( ! $id ) {
            return new WP_REST_Response( [ 'message' => 'Failed to create reseller.' ], 500 );
        }

        // Auto-create a BD record (OWNER) for the Reseller's own QR tracking.
        if ( $wp_user_id ) {
            $tracking_code = strtoupper( $slug ) . '-OWNER';

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

        $created = Reseller::find( $id );
        self::enrich_reseller( $created );

        return new WP_REST_Response( $created, 201 );
    }

    /**
     * GET /resellers/next-code?prefix=EPOS — Preview the next reseller code for a prefix.
     */
    public static function preview_code( WP_REST_Request $request ) {
        $prefix = strtoupper( preg_replace( '/[^A-Za-z0-9]/', '', sanitize_text_field( $request->get_param( 'prefix' ) ) ) );

        if ( ! $prefix ) {
            return new WP_REST_Response( [ 'message' => 'Prefix is required.' ], 400 );
        }

        $code = Reseller::generate_code( $prefix );

        return new WP_REST_Response( [ 'code' => $code ], 200 );
    }

    public static function update( WP_REST_Request $request ) {
        $id       = $request->get_param( 'id' );
        $reseller = Reseller::find( $id );

        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        $data = [];
        if ( $request->get_param( 'name' ) )   $data['name']   = $request->get_param( 'name' );
        if ( $request->get_param( 'slug' ) )   $data['slug']   = $request->get_param( 'slug' );
        if ( $request->get_param( 'status' ) ) $data['status'] = $request->get_param( 'status' );

        Reseller::update( $id, $data );

        // Update WP user email if provided.
        if ( $request->get_param( 'email' ) && $reseller->wp_user_id ) {
            $new_email = sanitize_email( $request->get_param( 'email' ) );
            if ( $new_email ) {
                $existing = email_exists( $new_email );
                if ( $existing && (int) $existing !== (int) $reseller->wp_user_id ) {
                    return new WP_REST_Response( [ 'message' => 'This email is already in use.' ], 400 );
                }
                wp_update_user( [
                    'ID'         => $reseller->wp_user_id,
                    'user_email' => $new_email,
                ] );
            }
        }

        $updated = Reseller::find( $id );
        self::enrich_reseller( $updated );

        return new WP_REST_Response( $updated, 200 );
    }

    public static function destroy( WP_REST_Request $request ) {
        $id = $request->get_param( 'id' );

        if ( ! Reseller::find( $id ) ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        Reseller::deactivate( $id );

        return new WP_REST_Response( [ 'message' => 'Reseller deactivated.' ], 200 );
    }

    /**
     * Enrich a reseller object with email and QR data from the WP user and BD record.
     */
    private static function enrich_reseller( $reseller ) {
        $reseller->email         = '';
        $reseller->qr_token      = null;
        $reseller->tracking_code = null;

        if ( $reseller->wp_user_id ) {
            $user = get_userdata( $reseller->wp_user_id );
            if ( $user ) {
                $reseller->email = $user->user_email;
            }

            $bd = BD::find_by_user_id( $reseller->wp_user_id );
            if ( $bd ) {
                $reseller->qr_token      = $bd->qr_token;
                $reseller->tracking_code = $bd->tracking_code;
            }
        }

        // Assigned product labels.
        $assignments = \EposAffiliate\Models\ProductAssignment::for_reseller( $reseller->id );
        $reseller->product_count  = count( $assignments );
        $reseller->product_labels = array_values( array_map( function( $a ) {
            return $a->product_label ?: 'Unnamed';
        }, array_filter( $assignments, fn( $a ) => $a->status === 'active' ) ) );
    }
}
