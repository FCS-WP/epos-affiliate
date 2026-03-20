<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\ExportController;

class ExportRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/export/commissions', [
            'methods'             => 'GET',
            'callback'            => [ ExportController::class, 'commissions' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );

        register_rest_route( $ns, '/export/attributions', [
            'methods'             => 'GET',
            'callback'            => [ ExportController::class, 'attributions' ],
            'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
        ] );
    }
}
