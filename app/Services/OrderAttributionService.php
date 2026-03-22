<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\OrderAttribution;
use EposAffiliate\Models\Commission;
use EposAffiliate\Services\Logger;

class OrderAttributionService {

    public static function init() {
        add_action( 'woocommerce_order_status_processing', [ self::class, 'attribute_order' ], 10, 1 );
    }

    /**
     * When an order reaches "processing" (payment received):
     * 1. Read BD attribution from order meta (written by CheckoutService)
     * 2. Create an order attribution record
     * 3. Create a pending sales commission record
     * 4. Add order note with commission details
     */
    public static function attribute_order( $order_id ) {
        $order = wc_get_order( $order_id );

        if ( ! $order ) {
            Logger::error( "Order not found: #{$order_id}", 'Attribution' );
            return;
        }

        // Skip if already processed.
        if ( $order->get_meta( '_epos_attribution_processed' ) ) {
            Logger::info( "Order #{$order_id} already processed. Skipping.", 'Attribution' );
            return;
        }

        // Read BD attribution from order meta.
        $coupon_code = $order->get_meta( '_bd_coupon_code' );
        $bd_user_id  = absint( $order->get_meta( '_bd_user_id' ) );
        $reseller_id = absint( $order->get_meta( '_reseller_id' ) );

        if ( ! $coupon_code || ! $bd_user_id ) {
            return; // Normal order, not BD-attributed.
        }

        Logger::info( "Processing order #{$order_id}. Tracking: {$coupon_code}, BD User: {$bd_user_id}, Reseller: {$reseller_id}", 'Attribution' );

        // Find the BD record.
        $bd = \EposAffiliate\Models\BD::find_by_user_id( $bd_user_id );
        if ( ! $bd ) {
            Logger::error( "BD not found for user ID: {$bd_user_id}. Order #{$order_id} attribution skipped.", 'Attribution' );
            $order->add_order_note( "⚠️ BD Attribution failed: BD user #{$bd_user_id} not found in system." );
            return;
        }

        // Order value net of tax and shipping.
        $order_total    = (float) $order->get_total();
        $order_tax      = (float) $order->get_total_tax();
        $order_shipping = (float) $order->get_shipping_total();
        $order_value    = $order_total - $order_tax - $order_shipping;

        Logger::info( "Order #{$order_id} value: Total={$order_total}, Tax={$order_tax}, Shipping={$order_shipping}, Net={$order_value}", 'Attribution' );

        // Create attribution record.
        $attribution_id = OrderAttribution::create( [
            'order_id'      => $order_id,
            'bd_id'         => $bd->id,
            'reseller_id'   => $reseller_id,
            'tracking_code' => $coupon_code,
            'order_value'   => $order_value,
        ] );

        Logger::info( "Attribution created. ID: {$attribution_id}, Order: #{$order_id}, BD: {$bd->name} (ID: {$bd->id})", 'Attribution' );

        // Create pending sales commission.
        $settings        = get_option( 'epos_affiliate_settings', [] );
        $commission_rate = floatval( $settings['sales_commission_rate'] ?? 0 );
        $commission_amt  = round( $order_value * ( $commission_rate / 100 ), 2 );

        Logger::info( "Commission calc: Order value={$order_value}, Rate={$commission_rate}%, Amount={$commission_amt}", 'Attribution' );

        $commission_id = Commission::create( [
            'bd_id'        => $bd->id,
            'reseller_id'  => $reseller_id,
            'type'         => 'sales',
            'reference_id' => $order_id,
            'amount'       => $commission_amt,
            'status'       => 'pending',
            'period_month' => gmdate( 'Y-m' ),
        ] );

        Logger::info( "Commission created. ID: {$commission_id}, Amount: RM{$commission_amt}, Status: pending", 'Attribution' );

        // Add detailed order note.
        $bd_user = get_userdata( $bd_user_id );
        $bd_name = $bd_user ? $bd_user->display_name : $bd->name;

        $note = sprintf(
            "✅ Sales Commission Created\n" .
            "━━━━━━━━━━━━━━━━━━━━\n" .
            "BD Agent: %s\n" .
            "Tracking Code: %s\n" .
            "Reseller ID: %d\n" .
            "Order Value (net): RM %.2f\n" .
            "Commission Rate: %s%%\n" .
            "Commission Amount: RM %.2f\n" .
            "Commission Status: Pending\n" .
            "Period: %s",
            $bd_name,
            $coupon_code,
            $reseller_id,
            $order_value,
            $commission_rate,
            $commission_amt,
            gmdate( 'Y-m' )
        );
        $order->add_order_note( $note );

        // Mark as processed.
        $order->update_meta_data( '_epos_attribution_processed', '1' );
        $order->save();

        Logger::info( "Order #{$order_id} fully processed. Attribution + commission complete.", 'Attribution' );
    }

}
