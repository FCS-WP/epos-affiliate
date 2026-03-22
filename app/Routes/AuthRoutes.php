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
            'permission_callback' => '__return_true', // Public endpoint — authentication is handled inside.
        ] );
    }
}
