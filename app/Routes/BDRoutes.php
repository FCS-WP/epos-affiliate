<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\BDController;

class BDRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/bds', [
            [
                'methods'             => 'GET',
                'callback'            => [ BDController::class, 'index' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ BDController::class, 'store' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );

        register_rest_route( $ns, '/bds/(?P<id>\d+)', [
            [
                'methods'             => 'GET',
                'callback'            => [ BDController::class, 'show' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [ BDController::class, 'update' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ BDController::class, 'destroy' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );
    }
}
