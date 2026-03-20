<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;
use WP_REST_Response;

class SettingsController {

    const OPTION_KEY = 'epos_affiliate_settings';

    const DEFAULTS = [
        'product_id'             => 2174,
        'sales_commission_rate'  => 0,
    ];

    public static function index( WP_REST_Request $request ) {
        $settings = get_option( self::OPTION_KEY, [] );
        $settings = wp_parse_args( $settings, self::DEFAULTS );

        return new WP_REST_Response( $settings, 200 );
    }

    public static function update( WP_REST_Request $request ) {
        $current  = get_option( self::OPTION_KEY, [] );
        $settings = wp_parse_args( $current, self::DEFAULTS );

        if ( $request->has_param( 'product_id' ) ) {
            $settings['product_id'] = absint( $request->get_param( 'product_id' ) );
        }

        if ( $request->has_param( 'sales_commission_rate' ) ) {
            $rate = floatval( $request->get_param( 'sales_commission_rate' ) );
            $settings['sales_commission_rate'] = max( 0, min( 100, $rate ) );
        }

        update_option( self::OPTION_KEY, $settings );

        return new WP_REST_Response( $settings, 200 );
    }
}
