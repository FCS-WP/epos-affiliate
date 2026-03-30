<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class SerialNumber {

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_serial_numbers';
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
     * Find by serial number (uniqueness check).
     */
    public static function find_by_serial( $serial_number ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE serial_number = %s", self::table(), $serial_number )
        );
    }

    /**
     * Get all serial numbers for an order.
     */
    public static function find_by_order( $order_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare( "SELECT * FROM %i WHERE order_id = %d ORDER BY assigned_at ASC", self::table(), $order_id )
        );
    }

    /**
     * Count assigned serial numbers for an order.
     */
    public static function count_by_order( $order_id ) {
        global $wpdb;
        return (int) $wpdb->get_var(
            $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE order_id = %d", self::table(), $order_id )
        );
    }

    /**
     * List serial numbers with filters.
     */
    public static function all( $args = [] ) {
        global $wpdb;
        $table = self::table();
        $bd_table = $wpdb->prefix . 'epos_bds';
        $reseller_table = $wpdb->prefix . 'epos_resellers';

        $where  = '1=1';
        $params = [ $table, $bd_table, $reseller_table ];

        if ( ! empty( $args['order_id'] ) ) {
            $where   .= ' AND sn.order_id = %d';
            $params[] = absint( $args['order_id'] );
        }

        if ( ! empty( $args['bd_id'] ) ) {
            $where   .= ' AND sn.bd_id = %d';
            $params[] = absint( $args['bd_id'] );
        }

        if ( ! empty( $args['reseller_id'] ) ) {
            $where   .= ' AND sn.reseller_id = %d';
            $params[] = absint( $args['reseller_id'] );
        }

        if ( ! empty( $args['status'] ) ) {
            $where   .= ' AND sn.status = %s';
            $params[] = sanitize_text_field( $args['status'] );
        }

        if ( ! empty( $args['search'] ) ) {
            $search   = '%' . $wpdb->esc_like( $args['search'] ) . '%';
            $where   .= ' AND (sn.serial_number LIKE %s OR CAST(sn.order_id AS CHAR) LIKE %s)';
            $params[] = $search;
            $params[] = $search;
        }

        if ( ! empty( $args['date_from'] ) ) {
            $where   .= ' AND sn.assigned_at >= %s';
            $params[] = sanitize_text_field( $args['date_from'] ) . ' 00:00:00';
        }

        if ( ! empty( $args['date_to'] ) ) {
            $where   .= ' AND sn.assigned_at <= %s';
            $params[] = sanitize_text_field( $args['date_to'] ) . ' 23:59:59';
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT sn.*, bd.name AS bd_name, r.name AS reseller_name
                 FROM %i sn
                 LEFT JOIN %i bd ON bd.id = sn.bd_id
                 LEFT JOIN %i r ON r.id = sn.reseller_id
                 WHERE $where
                 ORDER BY sn.assigned_at DESC",
                $params
            )
        );
    }

    /**
     * Create a serial number record.
     */
    public static function create( $data ) {
        global $wpdb;

        $result = $wpdb->insert( self::table(), [
            'order_id'      => absint( $data['order_id'] ),
            'bd_id'         => isset( $data['bd_id'] ) ? absint( $data['bd_id'] ) : null,
            'reseller_id'   => isset( $data['reseller_id'] ) ? absint( $data['reseller_id'] ) : null,
            'serial_number' => sanitize_text_field( $data['serial_number'] ),
            'product_id'    => isset( $data['product_id'] ) ? absint( $data['product_id'] ) : null,
            'status'        => $data['status'] ?? 'assigned',
            'assigned_by'   => isset( $data['assigned_by'] ) ? absint( $data['assigned_by'] ) : get_current_user_id(),
            'source'        => $data['source'] ?? 'manual',
        ] );

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Delete a serial number.
     */
    public static function delete( $id ) {
        global $wpdb;
        return $wpdb->delete( self::table(), [ 'id' => absint( $id ) ] );
    }

    /**
     * Count devices assigned to a BD's orders.
     */
    public static function stats_for_bd( $bd_id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT COUNT(*) AS total_devices,
                        SUM( CASE WHEN status = 'activated' THEN 1 ELSE 0 END ) AS activated_devices
                 FROM %i WHERE bd_id = %d",
                self::table(),
                $bd_id
            )
        );
    }
}
