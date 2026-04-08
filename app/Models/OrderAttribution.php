<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class OrderAttribution {

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_order_attributions';
    }

    /**
     * Find by order ID.
     */
    public static function find_by_order( $order_id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE order_id = %d", self::table(), $order_id )
        );
    }

    /**
     * Create an attribution record.
     */
    public static function create( $data ) {
        global $wpdb;

        $wpdb->insert( self::table(), [
            'order_id'      => absint( $data['order_id'] ),
            'bd_id'         => absint( $data['bd_id'] ),
            'reseller_id'   => absint( $data['reseller_id'] ),
            'tracking_code' => sanitize_text_field( $data['tracking_code'] ?? '' ),
            'order_value'   => floatval( $data['order_value'] ?? 0 ),
            'product_id'    => absint( $data['product_id'] ?? 0 ) ?: null,
        ] );

        return $wpdb->insert_id ?: false;
    }

    /**
     * List attributions with optional filters.
     */
    public static function all( $args = [] ) {
        global $wpdb;
        $table = self::table();

        $where  = '1=1';
        $params = [];

        if ( ! empty( $args['bd_id'] ) ) {
            $where   .= ' AND bd_id = %d';
            $params[] = absint( $args['bd_id'] );
        }

        if ( ! empty( $args['reseller_id'] ) ) {
            $where   .= ' AND reseller_id = %d';
            $params[] = absint( $args['reseller_id'] );
        }

        if ( ! empty( $args['date_from'] ) ) {
            $where   .= ' AND attributed_at >= %s';
            $params[] = sanitize_text_field( $args['date_from'] ) . ' 00:00:00';
        }

        if ( ! empty( $args['date_to'] ) ) {
            $where   .= ' AND attributed_at <= %s';
            $params[] = sanitize_text_field( $args['date_to'] ) . ' 23:59:59';
        }

        $order = 'ORDER BY attributed_at DESC';

        if ( $params ) {
            return $wpdb->get_results(
                $wpdb->prepare( "SELECT * FROM %i WHERE $where $order", array_merge( [ $table ], $params ) )
            );
        }

        return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i $order", $table ) );
    }

    /**
     * Get aggregated stats for a BD.
     */
    public static function stats_for_bd( $bd_id, $date_from = null, $date_to = null ) {
        global $wpdb;
        $table = self::table();

        $where  = 'bd_id = %d';
        $params = [ $table, $bd_id ];

        if ( $date_from ) {
            $where   .= ' AND attributed_at >= %s';
            $params[] = $date_from . ' 00:00:00';
        }

        if ( $date_to ) {
            $where   .= ' AND attributed_at <= %s';
            $params[] = $date_to . ' 23:59:59';
        }

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT COUNT(*) as total_orders, COALESCE(SUM(order_value), 0) as total_revenue,
                        MAX(attributed_at) as last_sale_date
                 FROM %i WHERE $where",
                $params
            )
        );
    }

    /**
     * Get total system stats (all resellers).
     */
    public static function stats_total() {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT COUNT(*) as total_orders, COALESCE(SUM(order_value), 0) as total_revenue
                 FROM %i",
                self::table()
            )
        );
    }

    /**
     * Get daily revenue for the last N days (for chart).
     */
    public static function stats_daily( $days = 30 ) {
        global $wpdb;
        $table = self::table();
        $since = gmdate( 'Y-m-d', strtotime( "-{$days} days" ) );

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT DATE(attributed_at) as date, COALESCE(SUM(order_value), 0) as revenue, COUNT(*) as orders
                 FROM %i
                 WHERE attributed_at >= %s
                 GROUP BY DATE(attributed_at)
                 ORDER BY date ASC",
                $table,
                $since . ' 00:00:00'
            )
        );
    }

    /**
     * Get top resellers by revenue.
     */
    public static function top_resellers( $limit = 5 ) {
        global $wpdb;
        $table          = self::table();
        $reseller_table = $wpdb->prefix . 'epos_resellers';

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT a.reseller_id, r.name, COALESCE(SUM(a.order_value), 0) as revenue, COUNT(*) as orders
                 FROM %i a
                 LEFT JOIN %i r ON a.reseller_id = r.id
                 GROUP BY a.reseller_id, r.name
                 ORDER BY revenue DESC
                 LIMIT %d",
                $table,
                $reseller_table,
                $limit
            )
        );
    }

    /**
     * Get recent transactions with BD and reseller names.
     */
    public static function recent( $limit = 10 ) {
        global $wpdb;
        $table          = self::table();
        $bd_table       = $wpdb->prefix . 'epos_bds';
        $reseller_table = $wpdb->prefix . 'epos_resellers';
        $commission_table = $wpdb->prefix . 'epos_commissions';

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT a.order_id, a.order_value, a.attributed_at,
                        b.name as bd_name, b.tracking_code,
                        r.name as reseller_name,
                        c.status as commission_status
                 FROM %i a
                 LEFT JOIN %i b ON a.bd_id = b.id
                 LEFT JOIN %i r ON a.reseller_id = r.id
                 LEFT JOIN %i c ON c.reference_id = a.order_id AND c.type = 'sales'
                 ORDER BY a.attributed_at DESC
                 LIMIT %d",
                $table,
                $bd_table,
                $reseller_table,
                $commission_table,
                $limit
            )
        );
    }

    /**
     * Get aggregated stats for all BDs in a reseller.
     */
    public static function stats_by_reseller( $reseller_id, $date_from = null, $date_to = null ) {
        global $wpdb;
        $table = self::table();

        $where  = 'a.reseller_id = %d';
        $params = [ $table, $reseller_id ];

        if ( $date_from ) {
            $where   .= ' AND a.attributed_at >= %s';
            $params[] = $date_from . ' 00:00:00';
        }

        if ( $date_to ) {
            $where   .= ' AND a.attributed_at <= %s';
            $params[] = $date_to . ' 23:59:59';
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT a.bd_id,
                        COUNT(*) as total_orders,
                        COALESCE(SUM(a.order_value), 0) as total_revenue,
                        MAX(a.attributed_at) as last_sale_date
                 FROM %i a
                 WHERE $where
                 GROUP BY a.bd_id",
                $params
            )
        );
    }
}
