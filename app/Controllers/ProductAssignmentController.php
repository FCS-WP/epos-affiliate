<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\ProductAssignment;
use EposAffiliate\Models\ProductCatalog;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\BD;
use WP_REST_Request;
use WP_REST_Response;

class ProductAssignmentController {

    /**
     * GET /product-assignments — List assignments for a reseller (joined with catalog).
     */
    public static function index( WP_REST_Request $request ) {
        $reseller_id = absint( $request->get_param( 'reseller_id' ) );

        if ( ! $reseller_id ) {
            return new WP_REST_Response( [ 'message' => 'reseller_id is required.' ], 400 );
        }

        $assignments = ProductAssignment::for_reseller( $reseller_id );

        // Enrich with WC product name.
        foreach ( $assignments as $a ) {
            $product = wc_get_product( $a->product_id );
            $a->wc_product_name = $product ? $product->get_name() : "Product #{$a->product_id}";
        }

        return new WP_REST_Response( $assignments, 200 );
    }

    /**
     * POST /product-assignments — Assign a catalog product to a reseller.
     */
    public static function store( WP_REST_Request $request ) {
        $reseller_id     = absint( $request->get_param( 'reseller_id' ) );
        $catalog_id      = absint( $request->get_param( 'catalog_id' ) );
        $commission_rate = $request->get_param( 'commission_rate' );

        if ( ! $reseller_id || ! $catalog_id ) {
            return new WP_REST_Response( [ 'message' => 'Reseller and catalog product are required.' ], 400 );
        }

        if ( ! Reseller::find( $reseller_id ) ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 404 );
        }

        $catalog = ProductCatalog::find( $catalog_id );
        if ( ! $catalog ) {
            return new WP_REST_Response( [ 'message' => 'Catalog product not found.' ], 404 );
        }

        // Use default commission from catalog if not provided.
        if ( $commission_rate === null || $commission_rate === '' ) {
            $commission_rate = $catalog->default_commission;
        }

        $id = ProductAssignment::create( [
            'reseller_id'    => $reseller_id,
            'catalog_id'     => $catalog_id,
            'commission_rate' => floatval( $commission_rate ),
        ] );

        if ( ! $id ) {
            return new WP_REST_Response( [ 'message' => 'This product is already assigned.' ], 400 );
        }

        // Return enriched assignment.
        $assignments = ProductAssignment::for_reseller( $reseller_id );
        $assignment  = null;
        foreach ( $assignments as $a ) {
            if ( (int) $a->id === $id ) { $assignment = $a; break; }
        }
        if ( $assignment ) {
            $product = wc_get_product( $assignment->product_id );
            $assignment->wc_product_name = $product ? $product->get_name() : '';
        }

        return new WP_REST_Response( $assignment, 201 );
    }

    /**
     * PUT /product-assignments/{id} — Update commission rate.
     */
    public static function update( WP_REST_Request $request ) {
        $id = absint( $request->get_param( 'id' ) );

        if ( ! ProductAssignment::find( $id ) ) {
            return new WP_REST_Response( [ 'message' => 'Assignment not found.' ], 404 );
        }

        $data = [];
        if ( $request->has_param( 'commission_rate' ) ) {
            $data['commission_rate'] = floatval( $request->get_param( 'commission_rate' ) );
        }
        if ( $request->has_param( 'status' ) ) {
            $data['status'] = sanitize_text_field( $request->get_param( 'status' ) );
        }

        if ( ! empty( $data ) ) {
            ProductAssignment::update( $id, $data );
        }

        return new WP_REST_Response( [ 'message' => 'Updated.' ], 200 );
    }

    /**
     * DELETE /product-assignments/{id} — Remove assignment.
     */
    public static function destroy( WP_REST_Request $request ) {
        $id = absint( $request->get_param( 'id' ) );

        if ( ! ProductAssignment::find( $id ) ) {
            return new WP_REST_Response( [ 'message' => 'Assignment not found.' ], 404 );
        }

        ProductAssignment::delete( $id );

        return new WP_REST_Response( [ 'message' => 'Assignment removed.' ], 200 );
    }

    /**
     * GET /product-assignments/for-qr — Public endpoint.
     * Returns the product choices for the current QR scan (reads BD from cookie).
     */
    public static function for_qr( WP_REST_Request $request ) {
        $cookie_data = \EposAffiliate\Services\QRRedirectService::get_attribution_from_cookie();

        if ( ! $cookie_data || empty( $cookie_data['bd_id'] ) ) {
            return new WP_REST_Response( [ 'message' => 'No QR scan data found.', 'products' => [] ], 200 );
        }

        $bd_id       = absint( $cookie_data['bd_id'] );
        $reseller_id = absint( $cookie_data['reseller_id'] ?? 0 );
        $bd_tracking = $cookie_data['bd_tracking'] ?? '';

        $bd = BD::find( $bd_id );
        if ( ! $bd || 'active' !== $bd->status ) {
            return new WP_REST_Response( [ 'message' => 'Invalid QR code.', 'products' => [] ], 200 );
        }

        $assignments = ProductAssignment::effective_for_bd( $bd_id, $reseller_id );
        $products    = [];

        foreach ( $assignments as $a ) {
            if ( $a->status !== 'active' ) continue;
            $wc_product = wc_get_product( $a->product_id );
            if ( ! $wc_product ) continue;

            $products[] = [
                'product_id'    => (int) $a->product_id,
                'product_label' => $a->product_label,
                'product_name'  => $wc_product->get_name(),
                'price'         => $wc_product->get_price(),
                'image'         => wp_get_attachment_url( $wc_product->get_image_id() ) ?: '',
                'permalink'     => get_permalink( $a->product_id ),
                'bd_tracking'   => $bd_tracking,
                'bd_user_id'    => (int) $bd->wp_user_id,
                'reseller_id'   => $reseller_id,
            ];
        }

        return new WP_REST_Response( [
            'bd_name'     => $bd->name,
            'bd_tracking' => $bd_tracking,
            'products'    => $products,
        ], 200 );
    }
}
