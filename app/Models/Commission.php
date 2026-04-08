<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class Commission {

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_commissions';
    }

    /**
     * Find by ID.
     */
    public static function find( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::table(), $id )
        );
    }

    /**
     * Create a commission record.
     */
    public static function create( $data ) {
        global $wpdb;

        $wpdb->insert( self::table(), [
            'bd_id'        => absint( $data['bd_id'] ),
            'reseller_id'  => absint( $data['reseller_id'] ),
            'type'         => sanitize_text_field( $data['type'] ?? 'sales' ),
            'reference_id' => absint( $data['reference_id'] ?? 0 ) ?: null,
            'product_id'   => absint( $data['product_id'] ?? 0 ) ?: null,
            'amount'       => floatval( $data['amount'] ?? 0 ),
            'status'       => sanitize_text_field( $data['status'] ?? 'pending' ),
            'period_month' => sanitize_text_field( $data['period_month'] ?? gmdate( 'Y-m' ) ),
        ] );

        return $wpdb->insert_id ?: false;
    }

    /**
     * Update commission status.
     */
    public static function update_status( $id, $status ) {
        global $wpdb;

        $update = [ 'status' => sanitize_text_field( $status ) ];

        if ( 'paid' === $status ) {
            $update['paid_at'] = current_time( 'mysql', true );
        }

        return $wpdb->update( self::table(), $update, [ 'id' => absint( $id ) ] );
    }

    /**
     * Bulk update statuses.
     */
    public static function bulk_update_status( $ids, $status ) {
        global $wpdb;
        $table = self::table();

        if ( empty( $ids ) ) return 0;

        $ids       = array_map( 'absint', $ids );
        $status    = sanitize_text_field( $status );
        $paid_at   = 'paid' === $status ? current_time( 'mysql', true ) : null;

        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );

        if ( $paid_at ) {
            return $wpdb->query(
                $wpdb->prepare(
                    "UPDATE %i SET status = %s, paid_at = %s WHERE id IN ($placeholders)",
                    array_merge( [ $table, $status, $paid_at ], $ids )
                )
            );
        }

        return $wpdb->query(
            $wpdb->prepare(
                "UPDATE %i SET status = %s WHERE id IN ($placeholders)",
                array_merge( [ $table, $status ], $ids )
            )
        );
    }

    /**
     * List commissions with optional filters.
     */
    public static function all( $args = [] ) {
        global $wpdb;
        $table    = self::table();
        $bd_table = $wpdb->prefix . 'epos_bds';
        $re_table = $wpdb->prefix . 'epos_resellers';

        $where  = '1=1';
        $params = [ $table, $bd_table, $re_table ];

        if ( ! empty( $args['status'] ) ) {
            $where   .= ' AND c.status = %s';
            $params[] = $args['status'];
        }

        if ( ! empty( $args['type'] ) ) {
            $where   .= ' AND c.type = %s';
            $params[] = $args['type'];
        }

        if ( ! empty( $args['bd_id'] ) ) {
            $where   .= ' AND c.bd_id = %d';
            $params[] = absint( $args['bd_id'] );
        }

        if ( ! empty( $args['reseller_id'] ) ) {
            $where   .= ' AND c.reseller_id = %d';
            $params[] = absint( $args['reseller_id'] );
        }

        if ( ! empty( $args['period_month'] ) ) {
            $where   .= ' AND c.period_month = %s';
            $params[] = $args['period_month'];
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT c.*, b.name as bd_name, b.tracking_code, r.name as reseller_name
                 FROM %i c
                 LEFT JOIN %i b ON c.bd_id = b.id
                 LEFT JOIN %i r ON c.reseller_id = r.id
                 WHERE $where
                 ORDER BY c.created_at DESC",
                $params
            )
        );
    }

    /**
     * Sum commissions for a BD by type and status.
     */
    public static function sum_for_bd( $bd_id, $type = null, $status = null ) {
        global $wpdb;
        $table = self::table();

        $where  = 'bd_id = %d';
        $params = [ $table, $bd_id ];

        if ( $type ) {
            $where   .= ' AND type = %s';
            $params[] = $type;
        }

        if ( $status ) {
            $where   .= ' AND status = %s';
            $params[] = $status;
        }

        return (float) $wpdb->get_var(
            $wpdb->prepare( "SELECT COALESCE(SUM(amount), 0) FROM %i WHERE $where", $params )
        );
    }

    /**
     * Sum commissions for a reseller (all BDs).
     */
    public static function sum_for_reseller( $reseller_id, $type = null, $status = null, $period_month = null ) {
        global $wpdb;
        $table = self::table();

        $where  = 'reseller_id = %d';
        $params = [ $table, $reseller_id ];

        if ( $type ) {
            $where   .= ' AND type = %s';
            $params[] = $type;
        }

        if ( $status ) {
            $where   .= ' AND status = %s';
            $params[] = $status;
        }

        if ( $period_month ) {
            $where   .= ' AND period_month = %s';
            $params[] = $period_month;
        }

        return (float) $wpdb->get_var(
            $wpdb->prepare( "SELECT COALESCE(SUM(amount), 0) FROM %i WHERE $where", $params )
        );
    }

    /**
     * Sum commissions grouped by BD for a reseller.
     */
    public static function sum_by_bd_for_reseller( $reseller_id, $type = null, $date_from = null, $date_to = null ) {
        global $wpdb;
        $table = self::table();

        $where  = 'reseller_id = %d';
        $params = [ $table, $reseller_id ];

        if ( $type ) {
            $where   .= ' AND type = %s';
            $params[] = $type;
        }

        if ( $date_from ) {
            $where   .= ' AND created_at >= %s';
            $params[] = $date_from . ' 00:00:00';
        }

        if ( $date_to ) {
            $where   .= ' AND created_at <= %s';
            $params[] = $date_to . ' 23:59:59';
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT bd_id, COALESCE(SUM(amount), 0) as total
                 FROM %i WHERE $where GROUP BY bd_id",
                $params
            )
        );
    }
}
