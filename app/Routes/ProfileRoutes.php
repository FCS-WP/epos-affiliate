<?php

namespace EposAffiliate\Routes;

use EposAffiliate\Controllers\ProfileController;

defined( 'ABSPATH' ) || exit;

class ProfileRoutes {

    public static function register() {
        register_rest_route( RouteRegistrar::API_NAMESPACE, '/profile', [
            [
                'methods'             => 'GET',
                'callback'            => [ ProfileController::class, 'get' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_view_own_profile' ],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [ ProfileController::class, 'update' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_view_own_profile' ],
            ],
        ] );

        register_rest_route( RouteRegistrar::API_NAMESPACE, '/profile/photo', [
            [
                'methods'             => 'POST',
                'callback'            => [ ProfileController::class, 'upload_photo' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_view_own_profile' ],
            ],
        ] );

        register_rest_route( RouteRegistrar::API_NAMESPACE, '/profile/password', [
            [
                'methods'             => 'PUT',
                'callback'            => [ ProfileController::class, 'change_password' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_view_own_profile' ],
            ],
        ] );
    }
}
