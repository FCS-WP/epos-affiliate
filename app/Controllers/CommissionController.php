<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\Commission;
use WP_REST_Request;
use WP_REST_Response;

class CommissionController {

    public static function index( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'status' ) )       $args['status']       = $request->get_param( 'status' );
        if ( $request->get_param( 'type' ) )         $args['type']         = $request->get_param( 'type' );
        if ( $request->get_param( 'bd_id' ) )        $args['bd_id']        = $request->get_param( 'bd_id' );
        if ( $request->get_param( 'reseller_id' ) )  $args['reseller_id']  = $request->get_param( 'reseller_id' );
        if ( $request->get_param( 'period_month' ) ) $args['period_month'] = $request->get_param( 'period_month' );

        return new WP_REST_Response( Commission::all( $args ), 200 );
    }

    public static function update( WP_REST_Request $request ) {
        $id     = $request->get_param( 'id' );
        $status = sanitize_text_field( $request->get_param( 'status' ) );

        $valid = [ 'pending', 'approved', 'paid', 'voided' ];
        if ( ! in_array( $status, $valid, true ) ) {
            return new WP_REST_Response( [ 'message' => 'Invalid status.' ], 400 );
        }

        $commission = Commission::find( $id );
        if ( ! $commission ) {
            return new WP_REST_Response( [ 'message' => 'Commission not found.' ], 404 );
        }

        Commission::update_status( $id, $status );

        return new WP_REST_Response( Commission::find( $id ), 200 );
    }

    public static function bulk_update( WP_REST_Request $request ) {
        $ids    = $request->get_param( 'ids' );
        $status = sanitize_text_field( $request->get_param( 'status' ) );

        if ( ! is_array( $ids ) || empty( $ids ) ) {
            return new WP_REST_Response( [ 'message' => 'No IDs provided.' ], 400 );
        }

        $valid = [ 'pending', 'approved', 'paid', 'voided' ];
        if ( ! in_array( $status, $valid, true ) ) {
            return new WP_REST_Response( [ 'message' => 'Invalid status.' ], 400 );
        }

        $updated = Commission::bulk_update_status( $ids, $status );

        return new WP_REST_Response( [ 'updated' => $updated ], 200 );
    }
}
