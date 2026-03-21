<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\DashboardController;

class DashboardRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/dashboard/reseller', [
            'methods'             => 'GET',
            'callback'            => [ DashboardController::class, 'reseller' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_view_reseller_dashboard' ],
        ] );

        register_rest_route( $ns, '/dashboard/reseller/export', [
            'methods'             => 'GET',
            'callback'            => [ DashboardController::class, 'reseller_export' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_view_reseller_dashboard' ],
        ] );

        register_rest_route( $ns, '/dashboard/reseller/bd/(?P<bd_id>\d+)/orders', [
            'methods'             => 'GET',
            'callback'            => [ DashboardController::class, 'reseller_bd_orders' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_view_reseller_dashboard' ],
        ] );

        register_rest_route( $ns, '/dashboard/bd', [
            'methods'             => 'GET',
            'callback'            => [ DashboardController::class, 'bd' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_view_bd_dashboard' ],
        ] );
    }
}
