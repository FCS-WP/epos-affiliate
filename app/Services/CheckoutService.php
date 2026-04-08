<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Services\Logger;
use EposAffiliate\Services\QRRedirectService;

class CheckoutService {

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_bd_redirect' ], 20 );
        add_action( 'woocommerce_checkout_create_order', [ self::class, 'write_attribution_to_order' ], 10, 2 );
    }

    /**
     * On a product page, if BD params are present (URL or cookie):
     * 1. Empty cart
     * 2. Add the specific product to cart
     * 3. Store BD + UTM + product info in WC session
     * 4. Redirect to checkout
     */
    public static function handle_bd_redirect() {
        if ( ! is_page() && ! is_single() ) {
            return;
        }

        // Get BD tracking from URL params.
        $bd_tracking = isset( $_GET['bd_tracking'] ) ? sanitize_text_field( wp_unslash( $_GET['bd_tracking'] ) ) : '';

        if ( empty( $bd_tracking ) ) {
            return;
        }

        // Read from URL params (primary).
        $bd_user_id   = absint( $_GET['bd_user_id'] ?? 0 );
        $reseller_id  = absint( $_GET['reseller_id'] ?? 0 );
        $epos_product = absint( $_GET['epos_product'] ?? 0 );

        // If URL params are incomplete, try to fill from cookie.
        if ( ! $bd_user_id || ! $reseller_id ) {
            $cookie_data = QRRedirectService::get_attribution_from_cookie();
            if ( $cookie_data && $cookie_data['bd_tracking'] === $bd_tracking ) {
                $bd_user_id  = $bd_user_id  ?: absint( $cookie_data['bd_user_id'] ?? 0 );
                $reseller_id = $reseller_id ?: absint( $cookie_data['reseller_id'] ?? 0 );
            }
        }

        Logger::info( "BD redirect triggered. Tracking: {$bd_tracking}, BD User: {$bd_user_id}, Reseller: {$reseller_id}, Product: {$epos_product}", 'Checkout' );

        // Product ID from URL param (required).
        if ( ! $epos_product ) {
            return;
        }
        $product_id = $epos_product;

        // 1. Empty cart.
        WC()->cart->empty_cart();

        // 2. Add product.
        WC()->cart->add_to_cart( $product_id, 1 );

        Logger::info( "Cart prepared. Product: {$product_id}, Tracking: {$bd_tracking}", 'Checkout' );

        // 3. Store BD attribution + product in WC session.
        WC()->session->set( 'epos_bd_tracking_code', $bd_tracking );
        WC()->session->set( 'epos_bd_user_id', $bd_user_id );
        WC()->session->set( 'epos_reseller_id', $reseller_id );
        WC()->session->set( 'epos_product_id', $product_id );
        WC()->session->set( 'epos_qr_sourced', 'yes' );

        // Store UTM params in session (from URL or cookie).
        $cookie_data = QRRedirectService::get_attribution_from_cookie();
        $utm_keys    = [ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content' ];
        foreach ( $utm_keys as $key ) {
            $val = isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) : '';
            if ( ! $val && $cookie_data ) {
                $val = $cookie_data[ $key ] ?? '';
            }
            if ( $val ) {
                WC()->session->set( 'epos_' . $key, $val );
            }
        }

        Logger::info( "Session stored. Redirecting to checkout.", 'Checkout' );

        // 4. Redirect to checkout.
        wp_redirect( wc_get_checkout_url() );
        exit;
    }

    /**
     * Write BD attribution data directly to order meta at order creation.
     *
     * Data source priority:
     * 1. WC session (set by handle_bd_redirect above)
     * 2. Cookie (fallback if session was lost but cookie persists)
     */
    public static function write_attribution_to_order( $order, $data ) {
        $bd_tracking = null;
        $bd_user_id  = null;
        $reseller_id = null;
        $product_id  = null;

        // Try WC session first.
        if ( WC()->session ) {
            $bd_tracking = WC()->session->get( 'epos_bd_tracking_code' );
            $bd_user_id  = WC()->session->get( 'epos_bd_user_id' );
            $reseller_id = WC()->session->get( 'epos_reseller_id' );
            $product_id  = WC()->session->get( 'epos_product_id' );
        }

        // Fallback to cookie if session doesn't have the data.
        if ( ! $bd_tracking || ! $bd_user_id ) {
            $cookie_data = QRRedirectService::get_attribution_from_cookie();
            if ( $cookie_data ) {
                $bd_tracking = $bd_tracking ?: ( $cookie_data['bd_tracking'] ?? '' );
                $bd_user_id  = $bd_user_id  ?: absint( $cookie_data['bd_user_id'] ?? 0 );
                $reseller_id = $reseller_id ?: absint( $cookie_data['reseller_id'] ?? 0 );
            }
        }

        if ( ! $bd_tracking || ! $bd_user_id ) {
            return;
        }

        Logger::info( "Writing attribution to order. Tracking: {$bd_tracking}, BD User: {$bd_user_id}, Reseller: {$reseller_id}, Product: {$product_id}", 'Checkout' );

        // Write BD attribution meta.
        $order->update_meta_data( '_bd_coupon_code', sanitize_text_field( $bd_tracking ) );
        $order->update_meta_data( '_bd_user_id', absint( $bd_user_id ) );
        $order->update_meta_data( '_reseller_id', absint( $reseller_id ) );
        if ( $product_id ) {
            $order->update_meta_data( '_epos_product_id', absint( $product_id ) );
        }
        $order->update_meta_data( '_attribution_status', 'attributed' );

        // UTM params from session or cookie.
        $cookie_data = $cookie_data ?? QRRedirectService::get_attribution_from_cookie();
        $utm_map = [
            '_attribution_source'   => 'epos_utm_source',
            '_attribution_medium'   => 'epos_utm_medium',
            '_attribution_campaign' => 'epos_utm_campaign',
            '_attribution_content'  => 'epos_utm_content',
        ];
        $utm_cookie_keys = [ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content' ];

        foreach ( $utm_map as $meta_key => $session_key ) {
            $val = WC()->session ? WC()->session->get( $session_key, '' ) : '';
            if ( ! $val && $cookie_data ) {
                $cookie_key = str_replace( 'epos_', '', $session_key );
                $val = $cookie_data[ $cookie_key ] ?? '';
            }
            if ( $val ) {
                $order->update_meta_data( $meta_key, sanitize_text_field( $val ) );
            }
        }

        // Order note.
        $bd_user      = get_userdata( $bd_user_id );
        $bd_name      = $bd_user ? $bd_user->display_name : "User #{$bd_user_id}";
        $product      = $product_id ? wc_get_product( $product_id ) : null;
        $product_name = $product ? $product->get_name() : 'N/A';

        $note = sprintf(
            '🔗 BD Attribution: This order was referred by %s (Tracking: %s). Reseller ID: %d. Product: %s. Source: QR Code.',
            $bd_name,
            $bd_tracking,
            $reseller_id,
            $product_name
        );
        $order->add_order_note( $note );

        Logger::info( "Attribution written. BD: {$bd_name}, Tracking: {$bd_tracking}, Product: {$product_name}", 'Checkout' );

        // Clear session data.
        if ( WC()->session ) {
            $session_keys = [
                'epos_bd_tracking_code', 'epos_bd_user_id', 'epos_reseller_id',
                'epos_product_id', 'epos_qr_sourced',
            ];
            foreach ( $session_keys as $key ) {
                WC()->session->set( $key, null );
            }
            foreach ( array_values( $utm_map ) as $session_key ) {
                WC()->session->set( $session_key, null );
            }
        }

        // Clear attribution cookie after successful order.
        QRRedirectService::clear_attribution_cookie();
    }

}
