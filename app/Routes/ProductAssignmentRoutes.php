<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\ProductAssignmentController;

class ProductAssignmentRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/product-assignments', [
            [
                'methods'             => 'GET',
                'callback'            => [ ProductAssignmentController::class, 'index' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ ProductAssignmentController::class, 'store' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );

        register_rest_route( $ns, '/product-assignments/for-qr', [
            [
                'methods'             => 'GET',
                'callback'            => [ ProductAssignmentController::class, 'for_qr' ],
                'permission_callback' => '__return_true', // Public — reads BD from cookie.
            ],
        ] );

        register_rest_route( $ns, '/product-assignments/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [ ProductAssignmentController::class, 'update' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ ProductAssignmentController::class, 'destroy' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );
    }
}
