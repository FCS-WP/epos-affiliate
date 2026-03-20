<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\OrderAttribution;
use EposAffiliate\Models\Commission;

class OrderAttributionService {

    public static function init() {
        add_action( 'woocommerce_order_status_processing', [ self::class, 'attribute_order' ], 10, 1 );
    }

    /**
     * When an order reaches "processing" (payment received):
     * 1. Check for a BD tracking coupon
     * 2. Write attribution meta to the order
     * 3. Create an order attribution record
     * 4. Create a pending sales commission record
     */
    public static function attribute_order( $order_id ) {
        $order = wc_get_order( $order_id );

        if ( ! $order ) {
            return;
        }

        // Skip if already attributed.
        if ( $order->get_meta( '_bd_coupon_code' ) ) {
            return;
        }

        // Find a BD tracking coupon among applied coupons.
        $bd_coupon = null;
        foreach ( $order->get_coupon_codes() as $code ) {
            $coupon = new \WC_Coupon( $code );
            if ( 'true' === $coupon->get_meta( '_is_bd_tracking_coupon' ) ) {
                $bd_coupon = $coupon;
                break;
            }
        }

        if ( ! $bd_coupon ) {
            return;
        }

        $bd_user_id  = absint( $bd_coupon->get_meta( '_bd_user_id' ) );
        $reseller_id = absint( $bd_coupon->get_meta( '_reseller_id' ) );
        $coupon_code = $bd_coupon->get_code();

        // Write order meta.
        $order->update_meta_data( '_bd_coupon_code', $coupon_code );
        $order->update_meta_data( '_bd_user_id', $bd_user_id );
        $order->update_meta_data( '_reseller_id', $reseller_id );
        $order->update_meta_data( '_attribution_status', 'attributed' );

        // Pull UTM from session (stored by CheckoutService).
        $session = WC()->session;
        if ( $session ) {
            $utm_map = [
                '_attribution_source'   => 'epos_utm_source',
                '_attribution_medium'   => 'epos_utm_medium',
                '_attribution_campaign' => 'epos_utm_campaign',
                '_attribution_content'  => 'epos_utm_content',
            ];
            foreach ( $utm_map as $meta_key => $session_key ) {
                $val = $session->get( $session_key, '' );
                if ( $val ) {
                    $order->update_meta_data( $meta_key, sanitize_text_field( $val ) );
                }
            }
        }

        $order->save();

        // Find the BD record by wp_user_id.
        $bd = \EposAffiliate\Models\BD::find_by_user_id( $bd_user_id );
        if ( ! $bd ) {
            return;
        }

        // Order value net of tax and shipping.
        $order_value = (float) $order->get_total() - (float) $order->get_total_tax() - (float) $order->get_shipping_total();

        // Create attribution record.
        OrderAttribution::create( [
            'order_id'      => $order_id,
            'bd_id'         => $bd->id,
            'reseller_id'   => $reseller_id,
            'tracking_code' => $coupon_code,
            'order_value'   => $order_value,
        ] );

        // Create pending sales commission.
        $settings        = get_option( 'epos_affiliate_settings', [] );
        $commission_rate = floatval( $settings['sales_commission_rate'] ?? 0 );
        $commission_amt  = round( $order_value * ( $commission_rate / 100 ), 2 );

        Commission::create( [
            'bd_id'        => $bd->id,
            'reseller_id'  => $reseller_id,
            'type'         => 'sales',
            'reference_id' => $order_id,
            'amount'       => $commission_amt,
            'status'       => 'pending',
            'period_month' => gmdate( 'Y-m' ),
        ] );
    }
}
