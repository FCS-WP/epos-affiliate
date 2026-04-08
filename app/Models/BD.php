<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class BD {

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_bds';
    }

    /**
     * Find a BD by ID.
     */
    public static function find( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::table(), $id )
        );
    }

    /**
     * Find a BD by WP user ID.
     */
    public static function find_by_user_id( $wp_user_id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE wp_user_id = %d", self::table(), $wp_user_id )
        );
    }

    /**
     * Find a BD by QR token.
     */
    public static function find_by_token( $token ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE qr_token = %s", self::table(), $token )
        );
    }

    /**
     * Find a BD by tracking code.
     */
    public static function find_by_tracking_code( $code ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE tracking_code = %s", self::table(), $code )
        );
    }

    /**
     * List BDs with optional filters.
     */
    public static function all( $args = [] ) {
        global $wpdb;
        $table = self::table();

        $where  = '1=1';
        $params = [];

        if ( ! empty( $args['reseller_id'] ) ) {
            $where   .= ' AND reseller_id = %d';
            $params[] = absint( $args['reseller_id'] );
        }

        if ( ! empty( $args['status'] ) ) {
            $where   .= ' AND status = %s';
            $params[] = $args['status'];
        }

        $order = 'ORDER BY created_at DESC';

        if ( $params ) {
            return $wpdb->get_results(
                $wpdb->prepare( "SELECT * FROM %i WHERE $where $order", array_merge( [ $table ], $params ) )
            );
        }

        return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i $order", $table ) );
    }

    /**
     * Create a new BD.
     */
    public static function create( $data ) {
        global $wpdb;

        $wpdb->insert( self::table(), [
            'reseller_id'  => absint( $data['reseller_id'] ),
            'wp_user_id'   => absint( $data['wp_user_id'] ?? 0 ) ?: null,
            'name'         => sanitize_text_field( $data['name'] ),
            'tracking_code'=> strtoupper( sanitize_text_field( $data['tracking_code'] ) ),
            'qr_token'     => $data['qr_token'] ?? self::generate_token(),
            'status'       => $data['status'] ?? 'active',
        ] );

        return $wpdb->insert_id ?: false;
    }

    /**
     * Update a BD.
     */
    public static function update( $id, $data ) {
        global $wpdb;

        $update = [];
        if ( isset( $data['name'] ) )   $update['name']   = sanitize_text_field( $data['name'] );
        if ( isset( $data['status'] ) ) $update['status'] = sanitize_text_field( $data['status'] );

        if ( empty( $update ) ) return false;

        return $wpdb->update( self::table(), $update, [ 'id' => absint( $id ) ] );
    }

    /**
     * Deactivate a BD (soft delete).
     */
    public static function deactivate( $id ) {
        return self::update( $id, [ 'status' => 'inactive' ] );
    }

    /**
     * Count BDs for a given reseller.
     */
    public static function count_by_reseller( $reseller_id, $status = 'active' ) {
        global $wpdb;
        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM %i WHERE reseller_id = %d AND status = %s",
                self::table(),
                $reseller_id,
                $status
            )
        );
    }

    /**
     * Get the next BD number for a given reseller.
     * Counts all BDs (excluding OWNER) under the reseller and returns next number.
     * E.g., if EPOS-01-001, EPOS-01-002 exist, returns 3.
     */
    public static function next_number_for_reseller( $reseller_id ) {
        global $wpdb;

        $max = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT MAX(CAST(SUBSTRING_INDEX(tracking_code, '-', -1) AS UNSIGNED))
                 FROM %i
                 WHERE reseller_id = %d
                   AND tracking_code NOT LIKE '%%OWNER'",
                self::table(),
                $reseller_id
            )
        );

        return ( (int) $max ) + 1;
    }

    /**
     * Generate a BD tracking code for a reseller.
     * Format: [RESELLER_CODE]-[NNN] (e.g., EPOS-01-001)
     */
    public static function generate_tracking_code( $reseller_id, $reseller_slug ) {
        $reseller_code = strtoupper( $reseller_slug );
        $number        = self::next_number_for_reseller( $reseller_id );
        return $reseller_code . '-' . str_pad( $number, 3, '0', STR_PAD_LEFT );
    }

    /**
     * Generate a unique random token for QR URLs.
     */
    public static function generate_token() {
        return bin2hex( random_bytes( 16 ) );
    }
}
