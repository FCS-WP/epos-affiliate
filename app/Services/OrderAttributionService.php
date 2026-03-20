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
     * 1. Read BD attribution from order meta (written by CheckoutService)
     * 2. Create an order attribution record
     * 3. Create a pending sales commission record
     *
     * No coupon lookup needed — BD data is stored as invisible order meta.
     */
    public static function attribute_order( $order_id ) {
        $order = wc_get_order( $order_id );

        if ( ! $order ) {
            return;
        }

        // Skip if already processed (attribution record exists).
        if ( $order->get_meta( '_epos_attribution_processed' ) ) {
            return;
        }

        // Read BD attribution from order meta (written by CheckoutService::write_attribution_to_order).
        $coupon_code = $order->get_meta( '_bd_coupon_code' );
        $bd_user_id  = absint( $order->get_meta( '_bd_user_id' ) );
        $reseller_id = absint( $order->get_meta( '_reseller_id' ) );

        if ( ! $coupon_code || ! $bd_user_id ) {
            return; // Not a BD-attributed order.
        }

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

        // Mark as processed so we don't create duplicate records.
        $order->update_meta_data( '_epos_attribution_processed', '1' );
        $order->save();
    }
}
