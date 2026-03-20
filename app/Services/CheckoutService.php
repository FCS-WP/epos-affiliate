<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

class CheckoutService {

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_coupon_redirect' ], 20 );
        add_action( 'wp_enqueue_scripts', [ self::class, 'maybe_hide_coupon_field' ] );
    }

    /**
     * On the bluetap page, if a coupon param is present:
     * 1. Empty cart
     * 2. Add product to cart
     * 3. Apply tracking coupon
     * 4. Store UTM params in WC session
     * 5. Redirect to checkout
     */
    public static function handle_coupon_redirect() {
        if ( ! is_page() ) {
            return;
        }

        $coupon_code = isset( $_GET['coupon'] ) ? sanitize_text_field( wp_unslash( $_GET['coupon'] ) ) : '';

        if ( empty( $coupon_code ) ) {
            return;
        }

        // Only act on the bluetap product page.
        $request_uri = trim( $_SERVER['REQUEST_URI'], '/' );
        if ( strpos( $request_uri, 'my/bluetap' ) === false ) {
            return;
        }

        // Verify this is a BD tracking coupon.
        $coupon = new \WC_Coupon( $coupon_code );
        if ( ! $coupon->get_id() || 'true' !== $coupon->get_meta( '_is_bd_tracking_coupon' ) ) {
            return;
        }

        $settings   = get_option( 'epos_affiliate_settings', [] );
        $product_id = absint( $settings['product_id'] ?? 2174 );

        // 1. Empty cart.
        WC()->cart->empty_cart();

        // 2. Add product.
        WC()->cart->add_to_cart( $product_id, 1 );

        // 3. Apply coupon.
        WC()->cart->apply_coupon( $coupon_code );

        // 4. Store UTM params in session.
        $utm_keys = [ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content' ];
        foreach ( $utm_keys as $key ) {
            if ( isset( $_GET[ $key ] ) ) {
                WC()->session->set( 'epos_' . $key, sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) );
            }
        }

        // Mark this session as QR-sourced so we can lock the coupon field.
        WC()->session->set( 'epos_qr_sourced', 'yes' );

        // 5. Redirect to checkout.
        wp_redirect( wc_get_checkout_url() );
        exit;
    }

    /**
     * On checkout page, if QR-sourced, enqueue inline JS to hide/lock the coupon field.
     */
    public static function maybe_hide_coupon_field() {
        if ( ! is_checkout() || ! WC()->session ) {
            return;
        }

        if ( 'yes' !== WC()->session->get( 'epos_qr_sourced' ) ) {
            return;
        }

        wp_add_inline_script( 'woocommerce', '
            document.addEventListener("DOMContentLoaded", function() {
                var couponToggle = document.querySelector(".woocommerce-form-coupon-toggle");
                var couponForm   = document.querySelector(".checkout_coupon");
                if (couponToggle) couponToggle.style.display = "none";
                if (couponForm) couponForm.style.display = "none";
            });
        ' );
    }
}
