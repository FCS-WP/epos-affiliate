<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\UsageBonusController;

class UsageBonusRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        // Webhook for N8N — secured by API key header.
        register_rest_route( $ns, '/usage-bonus/process', [
            [
                'methods'             => 'POST',
                'callback'            => [ UsageBonusController::class, 'process' ],
                'permission_callback' => '__return_true', // Auth handled inside callback.
            ],
        ] );

        // Admin: list usage bonus records.
        register_rest_route( $ns, '/usage-bonus', [
            [
                'methods'             => 'GET',
                'callback'            => [ UsageBonusController::class, 'index' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );
    }

    /**
     * Verify the API key from X-API-Key header.
     * Returns true if valid, WP_REST_Response error if not.
     */
    public static function verify_api_key() {
        $api_key = get_option( 'epos_affiliate_api_key', '' );

        if ( empty( $api_key ) ) {
            return new \WP_REST_Response(
                [ 'code' => 'unauthorized', 'message' => 'API key not configured.' ],
                401
            );
        }

        $provided = isset( $_SERVER['HTTP_X_API_KEY'] ) ? sanitize_text_field( $_SERVER['HTTP_X_API_KEY'] ) : '';

        if ( empty( $provided ) || ! hash_equals( $api_key, $provided ) ) {
            return new \WP_REST_Response(
                [ 'code' => 'unauthorized', 'message' => 'Invalid API key.' ],
                401
            );
        }

        return true;
    }
}
