<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Controllers\ProductCatalogController;

class ProductCatalogRoutes {

    public static function register() {
        $ns = RouteRegistrar::API_NAMESPACE;

        register_rest_route( $ns, '/product-catalog', [
            [
                'methods'             => 'GET',
                'callback'            => [ ProductCatalogController::class, 'index' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ ProductCatalogController::class, 'store' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );

        register_rest_route( $ns, '/product-catalog/wc-products', [
            [
                'methods'             => 'GET',
                'callback'            => [ ProductCatalogController::class, 'wc_products' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );

        register_rest_route( $ns, '/product-catalog/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [ ProductCatalogController::class, 'update' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ ProductCatalogController::class, 'destroy' ],
                'permission_callback' => [ RouteRegistrar::class, 'can_manage' ],
            ],
        ] );
    }
}
