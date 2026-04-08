<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\ProductCatalog;
use WP_REST_Request;
use WP_REST_Response;

class ProductCatalogController {

    /**
     * GET /product-catalog — List all catalog items.
     */
    public static function index( WP_REST_Request $request ) {
        $items = ProductCatalog::all();

        foreach ( $items as $item ) {
            self::enrich( $item );
        }

        return new WP_REST_Response( $items, 200 );
    }

    /**
     * POST /product-catalog — Create a new catalog item.
     */
    public static function store( WP_REST_Request $request ) {
        $label              = sanitize_text_field( $request->get_param( 'label' ) );
        $wc_product_id      = absint( $request->get_param( 'wc_product_id' ) );
        $default_commission = floatval( $request->get_param( 'default_commission' ) );

        if ( ! $label || ! $wc_product_id ) {
            return new WP_REST_Response( [ 'message' => 'Label and WooCommerce product are required.' ], 400 );
        }

        // Check label uniqueness.
        if ( ProductCatalog::find_by_label( $label ) ) {
            return new WP_REST_Response( [ 'message' => 'A product with this label already exists.' ], 400 );
        }

        $product = wc_get_product( $wc_product_id );
        if ( ! $product ) {
            return new WP_REST_Response( [ 'message' => 'WooCommerce product not found.' ], 404 );
        }

        $id = ProductCatalog::create( [
            'label'              => $label,
            'wc_product_id'      => $wc_product_id,
            'default_commission' => $default_commission,
        ] );

        if ( ! $id ) {
            return new WP_REST_Response( [ 'message' => 'Failed to create product.' ], 500 );
        }

        $item = ProductCatalog::find( $id );
        self::enrich( $item );

        return new WP_REST_Response( $item, 201 );
    }

    /**
     * PUT /product-catalog/{id} — Update a catalog item.
     */
    public static function update( WP_REST_Request $request ) {
        $id   = absint( $request->get_param( 'id' ) );
        $item = ProductCatalog::find( $id );

        if ( ! $item ) {
            return new WP_REST_Response( [ 'message' => 'Product not found.' ], 404 );
        }

        $data = [];

        if ( $request->has_param( 'label' ) ) {
            $label = sanitize_text_field( $request->get_param( 'label' ) );
            $existing = ProductCatalog::find_by_label( $label );
            if ( $existing && (int) $existing->id !== $id ) {
                return new WP_REST_Response( [ 'message' => 'A product with this label already exists.' ], 400 );
            }
            $data['label'] = $label;
        }

        if ( $request->has_param( 'wc_product_id' ) ) {
            $wc_id = absint( $request->get_param( 'wc_product_id' ) );
            if ( ! wc_get_product( $wc_id ) ) {
                return new WP_REST_Response( [ 'message' => 'WooCommerce product not found.' ], 404 );
            }
            $data['wc_product_id'] = $wc_id;
        }

        if ( $request->has_param( 'default_commission' ) ) {
            $data['default_commission'] = floatval( $request->get_param( 'default_commission' ) );
        }

        if ( $request->has_param( 'status' ) ) {
            $data['status'] = sanitize_text_field( $request->get_param( 'status' ) );
        }

        if ( ! empty( $data ) ) {
            ProductCatalog::update( $id, $data );
        }

        $updated = ProductCatalog::find( $id );
        self::enrich( $updated );

        return new WP_REST_Response( $updated, 200 );
    }

    /**
     * DELETE /product-catalog/{id} — Delete a catalog item.
     */
    public static function destroy( WP_REST_Request $request ) {
        $id = absint( $request->get_param( 'id' ) );

        if ( ! ProductCatalog::find( $id ) ) {
            return new WP_REST_Response( [ 'message' => 'Product not found.' ], 404 );
        }

        ProductCatalog::delete( $id );

        return new WP_REST_Response( [ 'message' => 'Product removed.' ], 200 );
    }

    /**
     * GET /product-catalog/wc-products — List available WooCommerce products for dropdown.
     */
    public static function wc_products( WP_REST_Request $request ) {
        $product_ids = wc_get_products( [
            'status' => 'publish',
            'limit'  => 100,
            'return' => 'ids',
        ] );

        $products = [];
        foreach ( $product_ids as $pid ) {
            $product = wc_get_product( $pid );
            if ( ! $product ) continue;

            $products[] = [
                'id'    => $product->get_id(),
                'name'  => $product->get_name(),
                'price' => $product->get_price(),
            ];
        }

        return new WP_REST_Response( $products, 200 );
    }

    /**
     * Enrich a catalog item with WC product name.
     */
    private static function enrich( $item ) {
        $product = wc_get_product( $item->wc_product_id );
        $item->wc_product_name = $product ? $product->get_name() : "Product #{$item->wc_product_id}";
        $item->wc_product_price = $product ? $product->get_price() : '0';
    }
}
