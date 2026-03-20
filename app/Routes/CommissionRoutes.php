<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\CommissionController;

class CommissionRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/commissions', [
            'methods'             => 'GET',
            'callback'            => [ CommissionController::class, 'index' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );

        register_rest_route( $ns, '/commissions/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [ CommissionController::class, 'update' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );

        register_rest_route( $ns, '/commissions/bulk', [
            'methods'             => 'POST',
            'callback'            => [ CommissionController::class, 'bulk_update' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );
    }
}
