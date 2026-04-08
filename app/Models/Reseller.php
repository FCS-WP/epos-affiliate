<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class Reseller {

    /**
     * Get table name.
     */
    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_resellers';
    }

    /**
     * Find a reseller by ID.
     */
    public static function find( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::table(), $id )
        );
    }

    /**
     * Find a reseller by WP user ID.
     */
    public static function find_by_user_id( $wp_user_id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE wp_user_id = %d", self::table(), $wp_user_id )
        );
    }

    /**
     * List all resellers with optional filters.
     */
    public static function all( $args = [] ) {
        global $wpdb;
        $table = self::table();

        $where  = '1=1';
        $params = [];

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
     * Create a new reseller.
     */
    public static function create( $data ) {
        global $wpdb;

        $wpdb->insert( self::table(), [
            'name'       => sanitize_text_field( $data['name'] ),
            'slug'       => sanitize_title( $data['slug'] ),
            'wp_user_id' => absint( $data['wp_user_id'] ?? 0 ) ?: null,
            'status'     => $data['status'] ?? 'active',
        ] );

        return $wpdb->insert_id ?: false;
    }

    /**
     * Update a reseller.
     */
    public static function update( $id, $data ) {
        global $wpdb;

        $update = [];
        if ( isset( $data['name'] ) )   $update['name']   = sanitize_text_field( $data['name'] );
        if ( isset( $data['slug'] ) )   $update['slug']   = sanitize_title( $data['slug'] );
        if ( isset( $data['status'] ) ) $update['status'] = sanitize_text_field( $data['status'] );

        if ( empty( $update ) ) return false;

        return $wpdb->update( self::table(), $update, [ 'id' => absint( $id ) ] );
    }

    /**
     * Deactivate a reseller (soft delete).
     */
    public static function deactivate( $id ) {
        return self::update( $id, [ 'status' => 'inactive' ] );
    }

    /**
     * Get the next reseller number for a given prefix.
     * E.g., if EPOS-01, EPOS-02 exist, returns 3.
     */
    public static function next_number_for_prefix( $prefix ) {
        global $wpdb;
        $prefix_upper = strtoupper( $prefix );
        $like_pattern = $prefix_upper . '-%';

        $max = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT MAX(CAST(SUBSTRING_INDEX(slug, '-', -1) AS UNSIGNED)) FROM %i WHERE UPPER(slug) LIKE %s",
                self::table(),
                $like_pattern
            )
        );

        return ( (int) $max ) + 1;
    }

    /**
     * Generate a reseller code from prefix.
     * Format: [PREFIX]-[NN] (e.g., EPOS-01, QASHIER-01)
     */
    public static function generate_code( $prefix ) {
        $prefix = strtoupper( preg_replace( '/[^A-Za-z0-9]/', '', $prefix ) );
        $number = self::next_number_for_prefix( $prefix );
        return $prefix . '-' . str_pad( $number, 2, '0', STR_PAD_LEFT );
    }

    /**
     * Count resellers by status.
     */
    public static function count( $status = null ) {
        global $wpdb;
        $table = self::table();

        if ( $status ) {
            return (int) $wpdb->get_var(
                $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE status = %s", $table, $status )
            );
        }

        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i", $table ) );
    }
}
