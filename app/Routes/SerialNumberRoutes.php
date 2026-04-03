<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

class SerialNumberRoutes {

    public static function register() {
        $ns = 'epos-affiliate/v1';

        register_rest_route( $ns, '/serial-numbers', [
            [
                'methods'             => 'GET',
                'callback'            => [ 'EposAffiliate\\Controllers\\SerialNumberController', 'index' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ 'EposAffiliate\\Controllers\\SerialNumberController', 'store' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );

        register_rest_route( $ns, '/serial-numbers/order/(?P<order_id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [ 'EposAffiliate\\Controllers\\SerialNumberController', 'order_serials' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );

        register_rest_route( $ns, '/serial-numbers/check/(?P<serial_number>[^/]+)', [
            'methods'             => 'GET',
            'callback'            => [ 'EposAffiliate\\Controllers\\SerialNumberController', 'check' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );

        register_rest_route( $ns, '/serial-numbers/bulk', [
            'methods'             => 'POST',
            'callback'            => [ 'EposAffiliate\\Controllers\\SerialNumberController', 'bulk_store' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );

        register_rest_route( $ns, '/serial-numbers/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [ 'EposAffiliate\\Controllers\\SerialNumberController', 'destroy' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );
    }
}
