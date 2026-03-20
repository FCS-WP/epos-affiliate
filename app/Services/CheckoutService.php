<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the QR → checkout flow.
 *
 * Instead of applying a WooCommerce coupon (which customers can see/remove),
 * BD attribution is stored silently in the WC session, then written directly
 * to order meta when the order is created. Nothing is visible to the customer.
 */
class CheckoutService {

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_bd_redirect' ], 20 );

        // Write BD attribution data to order meta at order creation.
        add_action( 'woocommerce_checkout_create_order', [ self::class, 'write_attribution_to_order' ], 10, 2 );
    }

    /**
     * On the bluetap page, if BD params are present:
     * 1. Empty cart
     * 2. Add product to cart
     * 3. Store BD + UTM info in WC session (no coupon)
     * 4. Redirect to checkout
     */
    public static function handle_bd_redirect() {
        if ( ! is_page() ) {
            return;
        }

        // Only act on the bluetap product page.
        $request_uri = trim( $_SERVER['REQUEST_URI'], '/' );
        if ( strpos( $request_uri, 'my/bluetap' ) === false ) {
            return;
        }

        // Check for BD tracking params (set by QRRedirectService).
        $bd_tracking = isset( $_GET['bd_tracking'] ) ? sanitize_text_field( wp_unslash( $_GET['bd_tracking'] ) ) : '';

        if ( empty( $bd_tracking ) ) {
            return;
        }

        $settings   = get_option( 'epos_affiliate_settings', [] );
        $product_id = absint( $settings['product_id'] ?? 2174 );

        // 1. Empty cart.
        WC()->cart->empty_cart();

        // 2. Add product.
        WC()->cart->add_to_cart( $product_id, 1 );

        // 3. Store BD attribution in session (invisible to customer).
        WC()->session->set( 'epos_bd_tracking_code', $bd_tracking );
        WC()->session->set( 'epos_bd_user_id', absint( $_GET['bd_user_id'] ?? 0 ) );
        WC()->session->set( 'epos_reseller_id', absint( $_GET['reseller_id'] ?? 0 ) );
        WC()->session->set( 'epos_qr_sourced', 'yes' );

        // Store UTM params in session.
        $utm_keys = [ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content' ];
        foreach ( $utm_keys as $key ) {
            if ( isset( $_GET[ $key ] ) ) {
                WC()->session->set( 'epos_' . $key, sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) );
            }
        }

        // 4. Redirect to checkout.
        wp_redirect( wc_get_checkout_url() );
        exit;
    }

    /**
     * Write BD attribution data directly to order meta at order creation.
     * This is called during woocommerce_checkout_create_order, before the order is saved.
     * The customer never sees any of this — it's all server-side.
     */
    public static function write_attribution_to_order( $order, $data ) {
        if ( ! WC()->session ) {
            return;
        }

        $bd_tracking = WC()->session->get( 'epos_bd_tracking_code' );
        $bd_user_id  = WC()->session->get( 'epos_bd_user_id' );
        $reseller_id = WC()->session->get( 'epos_reseller_id' );

        if ( ! $bd_tracking || ! $bd_user_id ) {
            return;
        }

        // Write BD attribution meta directly to the order.
        $order->update_meta_data( '_bd_coupon_code', sanitize_text_field( $bd_tracking ) );
        $order->update_meta_data( '_bd_user_id', absint( $bd_user_id ) );
        $order->update_meta_data( '_reseller_id', absint( $reseller_id ) );
        $order->update_meta_data( '_attribution_status', 'attributed' );

        // UTM params.
        $utm_map = [
            '_attribution_source'   => 'epos_utm_source',
            '_attribution_medium'   => 'epos_utm_medium',
            '_attribution_campaign' => 'epos_utm_campaign',
            '_attribution_content'  => 'epos_utm_content',
        ];
        foreach ( $utm_map as $meta_key => $session_key ) {
            $val = WC()->session->get( $session_key, '' );
            if ( $val ) {
                $order->update_meta_data( $meta_key, sanitize_text_field( $val ) );
            }
        }

        // Clear session data after writing to order.
        WC()->session->set( 'epos_bd_tracking_code', null );
        WC()->session->set( 'epos_bd_user_id', null );
        WC()->session->set( 'epos_reseller_id', null );
        WC()->session->set( 'epos_qr_sourced', null );
        foreach ( array_values( $utm_map ) as $session_key ) {
            WC()->session->set( $session_key, null );
        }
    }
}
