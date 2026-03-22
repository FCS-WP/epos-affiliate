<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the QR → checkout flow.
 *
 * BD attribution is stored silently in the WC session, then written directly
 * to order meta when the order is created. Nothing is visible to the customer.
 */
use EposAffiliate\Services\Logger;

class CheckoutService {

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_bd_redirect' ], 20 );
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

        $request_uri = trim( $_SERVER['REQUEST_URI'], '/' );
        if ( strpos( $request_uri, 'my/bluetap' ) === false ) {
            return;
        }

        $bd_tracking = isset( $_GET['bd_tracking'] ) ? sanitize_text_field( wp_unslash( $_GET['bd_tracking'] ) ) : '';

        if ( empty( $bd_tracking ) ) {
            return;
        }

        $bd_user_id  = absint( $_GET['bd_user_id'] ?? 0 );
        $reseller_id = absint( $_GET['reseller_id'] ?? 0 );

        Logger::info( "BD redirect triggered. Tracking: {$bd_tracking}, BD User: {$bd_user_id}, Reseller: {$reseller_id}", 'Checkout' );

        $settings   = get_option( 'epos_affiliate_settings', [] );
        $product_id = absint( $settings['product_id'] ?? 2174 );

        // 1. Empty cart.
        WC()->cart->empty_cart();

        // 2. Add product.
        WC()->cart->add_to_cart( $product_id, 1 );

        Logger::info( "Cart prepared. Product: {$product_id}, Tracking: {$bd_tracking}", 'Checkout' );

        // 3. Store BD attribution in session (invisible to customer).
        WC()->session->set( 'epos_bd_tracking_code', $bd_tracking );
        WC()->session->set( 'epos_bd_user_id', $bd_user_id );
        WC()->session->set( 'epos_reseller_id', $reseller_id );
        WC()->session->set( 'epos_qr_sourced', 'yes' );

        // Store UTM params in session.
        $utm_keys = [ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content' ];
        foreach ( $utm_keys as $key ) {
            if ( isset( $_GET[ $key ] ) ) {
                WC()->session->set( 'epos_' . $key, sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) );
            }
        }

        Logger::info( "Session stored. Redirecting to checkout.", 'Checkout' );

        // 4. Redirect to checkout.
        wp_redirect( wc_get_checkout_url() );
        exit;
    }

    /**
     * Write BD attribution data directly to order meta at order creation.
     * Also adds an order note so the admin can see BD attribution in order details.
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

        Logger::info( "Writing attribution to order. Tracking: {$bd_tracking}, BD User: {$bd_user_id}, Reseller: {$reseller_id}", 'Checkout' );

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

        // Get BD name for the order note.
        $bd_user = get_userdata( $bd_user_id );
        $bd_name = $bd_user ? $bd_user->display_name : "User #{$bd_user_id}";

        // Add order note (visible to admin in WooCommerce order details).
        $note = sprintf(
            '🔗 BD Attribution: This order was referred by %s (Tracking: %s). Reseller ID: %d. Source: QR Code.',
            $bd_name,
            $bd_tracking,
            $reseller_id
        );
        $order->add_order_note( $note );

        Logger::info( "Attribution meta + order note written. BD: {$bd_name}, Tracking: {$bd_tracking}", 'Checkout' );

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
