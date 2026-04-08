<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\SerialNumber;
use EposAffiliate\Models\Commission;
use EposAffiliate\Models\BD;
use EposAffiliate\Models\ProductCatalog;
use EposAffiliate\Models\ProductAssignment;
use EposAffiliate\Services\Logger;
use WP_REST_Request;
use WP_REST_Response;

class UsageBonusController {

    /**
     * POST /usage-bonus/process — Webhook for N8N.
     *
     * Payload:
     * {
     *   "entries": [
     *     { "pi_number": "LP-4179", "serial": "M61P200002003209" }
     *   ]
     * }
     *
     * For each entry:
     * 1. Look up serial number → get order_id, bd_id, reseller_id
     * 2. Look up product catalog → get usage_bonus amount
     * 3. Check for duplicate (same serial + same period)
     * 4. Create usage_bonus commission record
     */
    public static function process( WP_REST_Request $request ) {
        // Verify API key.
        $auth = \EposAffiliate\Routes\UsageBonusRoutes::verify_api_key();
        if ( $auth !== true ) {
            return $auth;
        }

        $params  = $request->get_json_params();
        $entries = $params['entries'] ?? [];

        if ( empty( $entries ) ) {
            return new WP_REST_Response( [ 'message' => 'No entries provided.' ], 400 );
        }

        $period  = gmdate( 'Y-m' );
        $results = [];
        $success = 0;
        $skipped = 0;
        $total_bonus = 0;

        Logger::info( "Usage bonus process started. Entries: " . count( $entries ) . ", Period: {$period}", 'UsageBonus' );

        // Pre-load catalog for bonus lookup.
        $catalog_items = ProductCatalog::all( 'active' );

        foreach ( $entries as $entry ) {
            $pi_number = sanitize_text_field( $entry['pi_number'] ?? '' );
            $serial    = sanitize_text_field( $entry['serial'] ?? '' );

            $result = [
                'serial'    => $serial,
                'pi_number' => $pi_number,
                'status'    => 'skipped',
                'reason'    => '',
            ];

            if ( empty( $serial ) ) {
                $result['reason'] = 'Serial number is empty.';
                $results[] = $result;
                $skipped++;
                continue;
            }

            // 1. Find order by pi_number (WC order number).
            $order_id = absint( str_replace( [ 'LP-', 'LP' ], '', $pi_number ) );
            $order    = $order_id ? wc_get_order( $order_id ) : null;

            if ( ! $order ) {
                // Try searching by order number if pi_number doesn't map directly.
                $order_id = wc_get_order_id_by_order_key( $pi_number );
                $order    = $order_id ? wc_get_order( $order_id ) : null;
            }

            // 2. Find or create the serial number record.
            $sn_record = SerialNumber::find_by_serial( $serial );

            if ( ! $sn_record && $order ) {
                // Auto-create SN record linked to this order.
                $bd_user_id  = absint( $order->get_meta( '_bd_user_id' ) );
                $reseller_id = absint( $order->get_meta( '_reseller_id' ) );
                $product_id  = absint( $order->get_meta( '_epos_product_id' ) );
                $bd          = $bd_user_id ? BD::find_by_user_id( $bd_user_id ) : null;

                SerialNumber::create( [
                    'order_id'      => $order->get_id(),
                    'bd_id'         => $bd ? $bd->id : null,
                    'reseller_id'   => $reseller_id ?: null,
                    'serial_number' => $serial,
                    'product_id'    => $product_id ?: null,
                    'status'        => 'assigned',
                    'source'        => 'n8n',
                ] );

                $sn_record = SerialNumber::find_by_serial( $serial );

                Logger::info( "Auto-created SN: {$serial} for order #{$order->get_id()}", 'UsageBonus' );
            }

            // 3. Resolve BD and reseller.
            $bd_id       = 0;
            $reseller_id = 0;
            $product_id  = 0;
            $order_id    = 0;

            if ( $sn_record ) {
                $order_id    = (int) $sn_record->order_id;
                $bd_id       = (int) ( $sn_record->bd_id ?? 0 );
                $reseller_id = (int) ( $sn_record->reseller_id ?? 0 );
                $product_id  = (int) ( $sn_record->product_id ?? 0 );
            }

            // If BD/reseller still missing, try order meta.
            if ( ( ! $bd_id || ! $reseller_id ) && $order_id ) {
                $order = $order ?: wc_get_order( $order_id );
                if ( $order ) {
                    $bd_user_id = absint( $order->get_meta( '_bd_user_id' ) );
                    if ( $bd_user_id ) {
                        $bd = BD::find_by_user_id( $bd_user_id );
                        if ( $bd ) {
                            $bd_id       = (int) $bd->id;
                            $reseller_id = (int) $bd->reseller_id;
                        }
                    }
                    if ( ! $product_id ) {
                        $product_id = absint( $order->get_meta( '_epos_product_id' ) );
                    }
                }
            }

            if ( ! $bd_id ) {
                $result['reason'] = 'No BD attribution found for this serial/order.';
                $results[] = $result;
                $skipped++;
                continue;
            }

            // 4. Determine usage bonus amount from product catalog.
            $bonus_amount = 0;
            if ( $product_id ) {
                foreach ( $catalog_items as $ci ) {
                    if ( (int) $ci->wc_product_id === $product_id ) {
                        $bonus_amount = floatval( $ci->usage_bonus );
                        break;
                    }
                }
            }

            // Fallback if no catalog match or bonus is 0.
            if ( $bonus_amount <= 0 ) {
                // Try first catalog item with usage_bonus > 0.
                foreach ( $catalog_items as $ci ) {
                    if ( floatval( $ci->usage_bonus ) > 0 ) {
                        $bonus_amount = floatval( $ci->usage_bonus );
                        break;
                    }
                }
            }

            if ( $bonus_amount <= 0 ) {
                $result['reason'] = 'No usage bonus configured in product catalog.';
                $results[] = $result;
                $skipped++;
                continue;
            }

            // 5. Check for duplicate — same serial + same period.
            $duplicate = self::has_existing_bonus( $serial, $period );
            if ( $duplicate ) {
                $result['reason'] = "Usage bonus already processed for this serial in {$period}.";
                $result['status'] = 'duplicate';
                $results[] = $result;
                $skipped++;
                continue;
            }

            // 6. Create usage bonus commission.
            $bd_record = BD::find( $bd_id );
            $commission_id = Commission::create( [
                'bd_id'        => $bd_id,
                'reseller_id'  => $reseller_id,
                'type'         => 'usage_bonus',
                'reference_id' => $order_id,
                'product_id'   => $product_id,
                'amount'       => $bonus_amount,
                'status'       => 'pending',
                'period_month' => $period,
            ] );

            if ( ! $commission_id ) {
                $result['reason'] = 'Failed to create commission record.';
                $results[] = $result;
                $skipped++;
                continue;
            }

            $result['status']         = 'success';
            $result['order_id']       = $order_id;
            $result['bd_name']        = $bd_record ? $bd_record->name : '';
            $result['tracking_code']  = $bd_record ? $bd_record->tracking_code : '';
            $result['reseller_id']    = $reseller_id;
            $result['bonus_amount']   = $bonus_amount;
            $result['commission_id']  = $commission_id;

            $results[] = $result;
            $success++;
            $total_bonus += $bonus_amount;

            Logger::info( "Usage bonus created. Serial: {$serial}, Order: #{$order_id}, BD: {$bd_id}, Amount: {$bonus_amount}", 'UsageBonus' );
        }

        Logger::info( "Usage bonus process completed. Success: {$success}, Skipped: {$skipped}, Total: {$total_bonus}", 'UsageBonus' );

        return new WP_REST_Response( [
            'data'    => $results,
            'summary' => [
                'total'       => count( $entries ),
                'success'     => $success,
                'skipped'     => $skipped,
                'total_bonus' => $total_bonus,
                'period'      => $period,
            ],
        ], 200 );
    }

    /**
     * Check if a usage bonus already exists for a serial in a given period.
     * Uses the serial number's order_id as reference_id + type = usage_bonus + period.
     */
    private static function has_existing_bonus( $serial, $period ) {
        global $wpdb;

        $sn_record = SerialNumber::find_by_serial( $serial );
        if ( ! $sn_record ) return false;

        $commissions_table = $wpdb->prefix . 'epos_commissions';

        return (bool) $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM %i WHERE type = 'usage_bonus' AND reference_id = %d AND period_month = %s LIMIT 1",
            $commissions_table,
            $sn_record->order_id,
            $period
        ) );
    }

    /**
     * GET /usage-bonus — Admin: list usage bonus commissions.
     */
    public static function index( WP_REST_Request $request ) {
        $args = [
            'type' => 'usage_bonus',
        ];

        if ( $request->get_param( 'reseller_id' ) ) {
            $args['reseller_id'] = $request->get_param( 'reseller_id' );
        }
        if ( $request->get_param( 'bd_id' ) ) {
            $args['bd_id'] = $request->get_param( 'bd_id' );
        }
        if ( $request->get_param( 'period_month' ) ) {
            $args['period_month'] = $request->get_param( 'period_month' );
        }
        if ( $request->get_param( 'status' ) ) {
            $args['status'] = $request->get_param( 'status' );
        }

        $commissions = Commission::all( $args );

        // Enrich with BD name, reseller name, serial number.
        foreach ( $commissions as $c ) {
            $bd = BD::find( $c->bd_id );
            $c->bd_name       = $bd ? $bd->name : '';
            $c->tracking_code = $bd ? $bd->tracking_code : '';

            $reseller = \EposAffiliate\Models\Reseller::find( $c->reseller_id );
            $c->reseller_name = $reseller ? $reseller->name : '';

            // Find serial number for this order.
            $serials = SerialNumber::find_by_order( $c->reference_id );
            $c->serial_number = ! empty( $serials ) ? $serials[0]->serial_number : '';
            $c->order_id      = $c->reference_id;
        }

        return new WP_REST_Response( $commissions, 200 );
    }
}
