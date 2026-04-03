<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\AuthController;

class AuthRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/auth/login', [
            'methods'             => 'POST',
            'callback'            => [ AuthController::class, 'login' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( $ns, '/auth/forgot-password', [
            'methods'             => 'POST',
            'callback'            => [ AuthController::class, 'forgot_password' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( $ns, '/auth/reset-password', [
            'methods'             => 'POST',
            'callback'            => [ AuthController::class, 'reset_password' ],
            'permission_callback' => '__return_true',
        ] );
    }
}
