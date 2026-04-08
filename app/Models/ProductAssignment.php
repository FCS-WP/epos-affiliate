<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class ProductAssignment {

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_product_assignments';
    }

    public static function find( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::table(), $id )
        );
    }

    /**
     * Get reseller-level assignments (bd_id IS NULL), joined with catalog.
     */
    public static function for_reseller( $reseller_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT pa.*, pc.label AS product_label, pc.wc_product_id AS product_id
                 FROM %i pa
                 JOIN %i pc ON pc.id = pa.catalog_id
                 WHERE pa.reseller_id = %d AND pa.bd_id IS NULL
                 ORDER BY pc.label ASC",
                self::table(),
                ProductCatalog::table(),
                $reseller_id
            )
        );
    }

    /**
     * Get BD-specific overrides, joined with catalog.
     */
    public static function for_bd( $bd_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT pa.*, pc.label AS product_label, pc.wc_product_id AS product_id
                 FROM %i pa
                 JOIN %i pc ON pc.id = pa.catalog_id
                 WHERE pa.bd_id = %d
                 ORDER BY pc.label ASC",
                self::table(),
                ProductCatalog::table(),
                $bd_id
            )
        );
    }

    /**
     * Get effective product assignments for a BD.
     * Returns BD-specific overrides if any exist, otherwise reseller defaults.
     */
    public static function effective_for_bd( $bd_id, $reseller_id ) {
        $bd_assignments = self::for_bd( $bd_id );

        if ( ! empty( $bd_assignments ) ) {
            return $bd_assignments;
        }

        return self::for_reseller( $reseller_id );
    }

    /**
     * Find the commission rate for a specific order context.
     * Looks up by wc_product_id through the catalog join.
     */
    public static function find_for_order( $bd_id, $reseller_id, $wc_product_id ) {
        global $wpdb;

        // Try BD-specific assignment first.
        $assignment = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT pa.*, pc.label AS product_label, pc.wc_product_id AS product_id
                 FROM %i pa
                 JOIN %i pc ON pc.id = pa.catalog_id
                 WHERE pa.bd_id = %d AND pc.wc_product_id = %d AND pa.status = 'active'",
                self::table(),
                ProductCatalog::table(),
                $bd_id,
                $wc_product_id
            )
        );

        if ( $assignment ) {
            return $assignment;
        }

        // Fall back to reseller-level.
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT pa.*, pc.label AS product_label, pc.wc_product_id AS product_id
                 FROM %i pa
                 JOIN %i pc ON pc.id = pa.catalog_id
                 WHERE pa.reseller_id = %d AND pa.bd_id IS NULL AND pc.wc_product_id = %d AND pa.status = 'active'",
                self::table(),
                ProductCatalog::table(),
                $reseller_id,
                $wc_product_id
            )
        );
    }

    /**
     * Create a new product assignment.
     */
    public static function create( $data ) {
        global $wpdb;

        $reseller_id = absint( $data['reseller_id'] );
        $bd_id       = isset( $data['bd_id'] ) ? absint( $data['bd_id'] ) : null;
        $catalog_id  = absint( $data['catalog_id'] );

        // Check for duplicate (MySQL UNIQUE doesn't enforce when bd_id IS NULL).
        if ( $bd_id ) {
            $exists = $wpdb->get_var( $wpdb->prepare(
                "SELECT id FROM %i WHERE reseller_id = %d AND bd_id = %d AND catalog_id = %d",
                self::table(), $reseller_id, $bd_id, $catalog_id
            ) );
        } else {
            $exists = $wpdb->get_var( $wpdb->prepare(
                "SELECT id FROM %i WHERE reseller_id = %d AND bd_id IS NULL AND catalog_id = %d",
                self::table(), $reseller_id, $catalog_id
            ) );
        }

        if ( $exists ) {
            return false;
        }

        $wpdb->insert( self::table(), [
            'reseller_id'    => $reseller_id,
            'bd_id'          => $bd_id,
            'catalog_id'     => $catalog_id,
            'commission_rate' => floatval( $data['commission_rate'] ?? 0 ),
            'qr_token'       => $data['qr_token'] ?? bin2hex( random_bytes( 16 ) ),
            'status'         => $data['status'] ?? 'active',
        ] );

        return $wpdb->insert_id ?: false;
    }

    /**
     * Update a product assignment.
     */
    public static function update( $id, $data ) {
        global $wpdb;

        $update = [];
        if ( isset( $data['commission_rate'] ) ) $update['commission_rate'] = floatval( $data['commission_rate'] );
        if ( isset( $data['status'] ) )          $update['status']          = sanitize_text_field( $data['status'] );

        if ( empty( $update ) ) return false;

        return $wpdb->update( self::table(), $update, [ 'id' => absint( $id ) ] );
    }

    /**
     * Delete a product assignment.
     */
    public static function delete( $id ) {
        global $wpdb;
        return $wpdb->delete( self::table(), [ 'id' => absint( $id ) ] );
    }
}
