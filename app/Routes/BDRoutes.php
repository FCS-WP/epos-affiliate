<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\BDController;
use EposAffiliate\Controllers\ResellerBDController;

class BDRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        // ── Reseller-scoped BD management ──
        register_rest_route( $ns, '/my/bds', [
            [
                'methods'             => 'GET',
                'callback'            => [ ResellerBDController::class, 'index' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage_own_bds' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ ResellerBDController::class, 'store' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage_own_bds' ],
            ],
        ] );

        register_rest_route( $ns, '/my/bds/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [ ResellerBDController::class, 'update' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage_own_bds' ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ ResellerBDController::class, 'destroy' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage_own_bds' ],
            ],
        ] );

        // ── Admin BD management ──

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
