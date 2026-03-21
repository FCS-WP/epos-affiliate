<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\BD;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\OrderAttribution;
use EposAffiliate\Models\Commission;
use WP_REST_Request;
use WP_REST_Response;

class DashboardController {

    /**
     * Reseller Manager dashboard — scoped to own reseller_id.
     */
    public static function reseller( WP_REST_Request $request ) {
        $reseller = self::get_current_reseller();
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found for this user.' ], 403 );
        }

        $date_from = $request->get_param( 'date_from' );
        $date_to   = $request->get_param( 'date_to' );
        $bd_filter = $request->get_param( 'bd_id' );

        // Get all BDs for this reseller.
        $bds = BD::all( [ 'reseller_id' => $reseller->id ] );

        // Attribution stats grouped by BD.
        $attr_stats = OrderAttribution::stats_by_reseller( $reseller->id, $date_from, $date_to );
        $attr_map   = [];
        foreach ( $attr_stats as $s ) {
            $attr_map[ $s->bd_id ] = $s;
        }

        // Sales commission per BD.
        $sales_commissions = Commission::sum_by_bd_for_reseller( $reseller->id, 'sales', $date_from, $date_to );
        $sales_map = [];
        foreach ( $sales_commissions as $sc ) {
            $sales_map[ $sc->bd_id ] = (float) $sc->total;
        }

        // Usage bonus per BD (last month).
        $last_month   = gmdate( 'Y-m', strtotime( '-1 month' ) );
        $usage_bonuses = Commission::sum_by_bd_for_reseller( $reseller->id, 'usage_bonus' );
        $usage_map = [];
        foreach ( $usage_bonuses as $ub ) {
            $usage_map[ $ub->bd_id ] = (float) $ub->total;
        }

        // Build BD performance rows.
        $bd_rows = [];
        $total_orders           = 0;
        $total_revenue          = 0;
        $total_sales_commission = 0;
        $total_usage_bonus      = 0;

        foreach ( $bds as $bd ) {
            if ( $bd_filter && (int) $bd->id !== (int) $bd_filter ) {
                continue;
            }

            $stats       = $attr_map[ $bd->id ] ?? null;
            $orders      = $stats ? (int) $stats->total_orders : 0;
            $revenue     = $stats ? (float) $stats->total_revenue : 0;
            $sales_comm  = $sales_map[ $bd->id ] ?? 0;
            $usage_bonus = $usage_map[ $bd->id ] ?? 0;

            $bd_rows[] = [
                'id'               => $bd->id,
                'name'             => $bd->name,
                'tracking_code'    => $bd->tracking_code,
                'orders'           => $orders,
                'revenue'          => $revenue,
                'sales_commission' => $sales_comm,
                'usage_bonus'      => $usage_bonus,
                'last_sale_date'   => $stats->last_sale_date ?? null,
            ];

            $total_orders           += $orders;
            $total_revenue          += $revenue;
            $total_sales_commission += $sales_comm;
            $total_usage_bonus      += $usage_bonus;
        }

        $active_bd_count = BD::count_by_reseller( $reseller->id, 'active' );

        // BD list for filter dropdown.
        $bd_list = array_map( function( $bd ) {
            return [ 'id' => $bd->id, 'name' => $bd->name ];
        }, $bds );

        return new WP_REST_Response( [
            'kpis' => [
                'total_orders'           => $total_orders,
                'total_revenue'          => $total_revenue,
                'total_sales_commission' => $total_sales_commission,
                'total_usage_bonus'      => $total_usage_bonus,
                'active_bd_count'        => $active_bd_count,
            ],
            'bds'     => $bd_rows,
            'bd_list' => $bd_list,
        ], 200 );
    }

    /**
     * Reseller Manager CSV export.
     */
    public static function reseller_export( WP_REST_Request $request ) {
        $response = self::reseller( $request );
        $data     = $response->get_data();
        $rows     = $data['bds'] ?? [];

        $csv = "BD Name,Tracking Code,Orders,Revenue (RM),Sales Commission (RM),Usage Bonus (RM),Last Sale\n";
        foreach ( $rows as $row ) {
            $csv .= sprintf(
                "%s,%s,%d,%.2f,%.2f,%.2f,%s\n",
                $row['name'],
                $row['tracking_code'],
                $row['orders'],
                $row['revenue'],
                $row['sales_commission'],
                $row['usage_bonus'],
                $row['last_sale_date'] ?? ''
            );
        }

        $response = new WP_REST_Response( $csv, 200 );
        $response->header( 'Content-Type', 'text/csv' );
        $response->header( 'Content-Disposition', 'attachment; filename="reseller-report.csv"' );
        return $response;
    }

    /**
     * BD Agent dashboard — scoped to own BD record.
     */
    public static function bd( WP_REST_Request $request ) {
        $bd = self::get_current_bd();
        if ( ! $bd ) {
            return new WP_REST_Response( [ 'message' => 'BD not found for this user.' ], 403 );
        }

        $date_from = $request->get_param( 'date_from' );
        $date_to   = $request->get_param( 'date_to' );

        // Attribution stats.
        $stats = OrderAttribution::stats_for_bd( $bd->id, $date_from, $date_to );

        // Commissions.
        $commission_paid    = Commission::sum_for_bd( $bd->id, 'sales', 'paid' );
        $commission_pending = Commission::sum_for_bd( $bd->id, 'sales', 'pending' )
                            + Commission::sum_for_bd( $bd->id, 'sales', 'approved' );

        $current_month         = gmdate( 'Y-m' );
        $last_month            = gmdate( 'Y-m', strtotime( '-1 month' ) );
        $usage_bonus_current   = Commission::sum_for_bd( $bd->id, 'usage_bonus' );
        $usage_bonus_last_paid = 0;

        // Order history from attributions.
        $attributions = OrderAttribution::all( array_filter( [
            'bd_id'     => $bd->id,
            'date_from' => $date_from,
            'date_to'   => $date_to,
        ] ) );

        $orders = [];
        foreach ( $attributions as $attr ) {
            // Get commission for this order.
            $commission_records = Commission::all( [
                'bd_id' => $bd->id,
                'type'  => 'sales',
            ] );
            $comm_amount = 0;
            $comm_status = 'pending';
            foreach ( $commission_records as $cr ) {
                if ( (int) $cr->reference_id === (int) $attr->order_id ) {
                    $comm_amount = (float) $cr->amount;
                    $comm_status = $cr->status;
                    break;
                }
            }

            $orders[] = [
                'order_id'      => $attr->order_id,
                'date'          => $attr->attributed_at,
                'value'         => (float) $attr->order_value,
                'commission'    => $comm_amount,
                'payout_status' => $comm_status,
            ];
        }

        return new WP_REST_Response( [
            'tracking_code' => $bd->tracking_code,
            'kpis' => [
                'total_orders'         => (int) ( $stats->total_orders ?? 0 ),
                'commission_paid'      => $commission_paid,
                'commission_pending'   => $commission_pending,
                'usage_bonus_current'  => $usage_bonus_current,
                'usage_bonus_last_paid'=> $usage_bonus_last_paid,
            ],
            'orders' => $orders,
        ], 200 );
    }

    /**
     * Reseller views orders for a specific BD.
     */
    public static function reseller_bd_orders( WP_REST_Request $request ) {
        $reseller = self::get_current_reseller();
        if ( ! $reseller ) {
            return new WP_REST_Response( [ 'message' => 'Reseller not found.' ], 403 );
        }

        $bd_id = absint( $request->get_param( 'bd_id' ) );
        $bd    = BD::find( $bd_id );

        if ( ! $bd || (int) $bd->reseller_id !== (int) $reseller->id ) {
            return new WP_REST_Response( [ 'message' => 'BD not found or not in your organization.' ], 403 );
        }

        $date_from = $request->get_param( 'date_from' );
        $date_to   = $request->get_param( 'date_to' );

        $attributions = OrderAttribution::all( array_filter( [
            'bd_id'     => $bd->id,
            'date_from' => $date_from,
            'date_to'   => $date_to,
        ] ) );

        $commission_records = Commission::all( [
            'bd_id' => $bd->id,
            'type'  => 'sales',
        ] );

        $comm_map = [];
        foreach ( $commission_records as $cr ) {
            $comm_map[ (int) $cr->reference_id ] = $cr;
        }

        $orders = [];
        foreach ( $attributions as $attr ) {
            $cr          = $comm_map[ (int) $attr->order_id ] ?? null;
            $orders[]    = [
                'order_id'      => $attr->order_id,
                'date'          => $attr->attributed_at,
                'value'         => (float) $attr->order_value,
                'commission'    => $cr ? (float) $cr->amount : 0,
                'payout_status' => $cr ? $cr->status : 'pending',
            ];
        }

        return new WP_REST_Response( [
            'bd' => [
                'id'            => $bd->id,
                'name'          => $bd->name,
                'tracking_code' => $bd->tracking_code,
            ],
            'orders' => $orders,
        ], 200 );
    }

    // ── Helpers ──

    /**
     * Get the reseller record for the current logged-in user.
     * Admin gets the first reseller (for testing).
     */
    private static function get_current_reseller() {
        $user = wp_get_current_user();

        if ( in_array( 'administrator', $user->roles, true ) ) {
            $all = Reseller::all();
            return $all[0] ?? null;
        }

        return Reseller::find_by_user_id( $user->ID );
    }

    /**
     * Get the BD record for the current logged-in user.
     */
    private static function get_current_bd() {
        $user = wp_get_current_user();
        return BD::find_by_user_id( $user->ID );
    }
}
