<?php

namespace EposAffiliate\Models;

defined( 'ABSPATH' ) || exit;

class ProductCatalog {

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'epos_product_catalog';
    }

    public static function find( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::table(), $id )
        );
    }

    public static function find_by_label( $label ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE label = %s", self::table(), $label )
        );
    }

    /**
     * List all catalog items, optionally filtered by status.
     */
    public static function all( $status = null ) {
        global $wpdb;
        $table = self::table();

        if ( $status ) {
            return $wpdb->get_results(
                $wpdb->prepare( "SELECT * FROM %i WHERE status = %s ORDER BY label ASC", $table, $status )
            );
        }

        return $wpdb->get_results(
            $wpdb->prepare( "SELECT * FROM %i ORDER BY label ASC", $table )
        );
    }

    public static function create( $data ) {
        global $wpdb;

        $wpdb->insert( self::table(), [
            'label'              => sanitize_text_field( $data['label'] ),
            'wc_product_id'      => absint( $data['wc_product_id'] ),
            'default_commission' => floatval( $data['default_commission'] ?? 0 ),
            'usage_bonus'        => floatval( $data['usage_bonus'] ?? 0 ),
            'status'             => $data['status'] ?? 'active',
        ] );

        return $wpdb->insert_id ?: false;
    }

    public static function update( $id, $data ) {
        global $wpdb;

        $update = [];
        if ( isset( $data['label'] ) )              $update['label']              = sanitize_text_field( $data['label'] );
        if ( isset( $data['wc_product_id'] ) )      $update['wc_product_id']      = absint( $data['wc_product_id'] );
        if ( isset( $data['default_commission'] ) )  $update['default_commission'] = floatval( $data['default_commission'] );
        if ( isset( $data['usage_bonus'] ) )         $update['usage_bonus']        = floatval( $data['usage_bonus'] );
        if ( isset( $data['status'] ) )              $update['status']             = sanitize_text_field( $data['status'] );

        if ( empty( $update ) ) return false;

        return $wpdb->update( self::table(), $update, [ 'id' => absint( $id ) ] );
    }

    public static function delete( $id ) {
        global $wpdb;
        return $wpdb->delete( self::table(), [ 'id' => absint( $id ) ] );
    }
}
