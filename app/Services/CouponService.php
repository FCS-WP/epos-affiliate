<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

class CouponService {

    /**
     * Create a WooCommerce RM0 tracking coupon for a BD.
     *
     * @param string $tracking_code  e.g. BD-ACME-JS001
     * @param int    $bd_user_id     WordPress user ID of the BD
     * @param int    $reseller_id    Reseller record ID
     * @return int|false Coupon post ID or false on failure.
     */
    public static function create_tracking_coupon( $tracking_code, $bd_user_id, $reseller_id ) {
        if ( ! class_exists( 'WC_Coupon' ) ) {
            return false;
        }

        $settings   = get_option( 'epos_affiliate_settings', [] );
        $product_id = absint( $settings['product_id'] ?? 2174 );

        $coupon = new \WC_Coupon();
        $coupon->set_code( strtolower( $tracking_code ) );
        $coupon->set_discount_type( 'fixed_cart' );
        $coupon->set_amount( 0 );                       // RM0 — tracking only.
        $coupon->set_individual_use( true );             // No stacking.
        $coupon->set_product_ids( [ $product_id ] );     // Tied to BlueTap.
        $coupon->set_usage_limit( 0 );                   // Unlimited usage.
        $coupon->set_date_expires( null );               // No expiry.

        $coupon_id = $coupon->save();

        if ( ! $coupon_id ) {
            return false;
        }

        // Store custom BD meta on the coupon.
        update_post_meta( $coupon_id, '_bd_user_id', absint( $bd_user_id ) );
        update_post_meta( $coupon_id, '_reseller_id', absint( $reseller_id ) );
        update_post_meta( $coupon_id, '_is_bd_tracking_coupon', 'true' );

        return $coupon_id;
    }

    /**
     * Disable a coupon by setting its post status to 'draft'.
     *
     * @param string $tracking_code Coupon code to disable.
     */
    public static function disable_coupon( $tracking_code ) {
        $coupon = new \WC_Coupon( strtolower( $tracking_code ) );

        if ( ! $coupon->get_id() ) {
            return;
        }

        wp_update_post( [
            'ID'          => $coupon->get_id(),
            'post_status' => 'draft',
        ] );
    }

    /**
     * Re-enable a previously disabled coupon.
     *
     * @param string $tracking_code Coupon code to enable.
     */
    public static function enable_coupon( $tracking_code ) {
        $coupon = new \WC_Coupon( strtolower( $tracking_code ) );

        if ( ! $coupon->get_id() ) {
            return;
        }

        wp_update_post( [
            'ID'          => $coupon->get_id(),
            'post_status' => 'publish',
        ] );
    }
}
