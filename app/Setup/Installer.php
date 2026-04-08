<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

class Installer {

    /**
     * Run on plugin activation — create / update DB tables.
     */
    public static function activate() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "
            CREATE TABLE {$wpdb->prefix}epos_resellers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(255) NOT NULL,
                slug varchar(100) NOT NULL,
                wp_user_id bigint(20) unsigned DEFAULT NULL,
                status varchar(20) NOT NULL DEFAULT 'active',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY slug (slug),
                KEY wp_user_id (wp_user_id)
            ) $charset_collate;

            CREATE TABLE {$wpdb->prefix}epos_bds (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                reseller_id bigint(20) NOT NULL,
                wp_user_id bigint(20) unsigned DEFAULT NULL,
                name varchar(255) NOT NULL,
                tracking_code varchar(50) NOT NULL,
                qr_token varchar(64) NOT NULL,
                status varchar(20) NOT NULL DEFAULT 'active',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY tracking_code (tracking_code),
                UNIQUE KEY qr_token (qr_token),
                KEY reseller_id (reseller_id),
                KEY wp_user_id (wp_user_id)
            ) $charset_collate;

            CREATE TABLE {$wpdb->prefix}epos_order_attributions (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20) unsigned NOT NULL,
                bd_id bigint(20) NOT NULL,
                reseller_id bigint(20) NOT NULL,
                tracking_code varchar(50) DEFAULT NULL,
                order_value decimal(10,2) DEFAULT 0.00,
                attributed_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                KEY order_id (order_id),
                KEY bd_id (bd_id),
                KEY reseller_id (reseller_id)
            ) $charset_collate;

            CREATE TABLE {$wpdb->prefix}epos_commissions (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                bd_id bigint(20) NOT NULL,
                reseller_id bigint(20) NOT NULL,
                type varchar(20) NOT NULL DEFAULT 'sales',
                reference_id bigint(20) DEFAULT NULL,
                amount decimal(10,2) NOT NULL DEFAULT 0.00,
                status varchar(20) NOT NULL DEFAULT 'pending',
                period_month varchar(7) DEFAULT NULL,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                paid_at datetime DEFAULT NULL,
                PRIMARY KEY  (id),
                KEY bd_id (bd_id),
                KEY reseller_id (reseller_id),
                KEY status (status),
                KEY type (type),
                KEY period_month (period_month)
            ) $charset_collate;

            CREATE TABLE {$wpdb->prefix}epos_product_catalog (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                label varchar(50) NOT NULL,
                wc_product_id bigint(20) unsigned NOT NULL,
                default_commission decimal(10,2) NOT NULL DEFAULT 0.00,
                usage_bonus decimal(10,2) NOT NULL DEFAULT 0.00,
                status varchar(20) NOT NULL DEFAULT 'active',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY label (label),
                KEY wc_product_id (wc_product_id)
            ) $charset_collate;

            CREATE TABLE {$wpdb->prefix}epos_product_assignments (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                reseller_id bigint(20) NOT NULL,
                bd_id bigint(20) DEFAULT NULL,
                catalog_id bigint(20) NOT NULL,
                commission_rate decimal(10,2) NOT NULL DEFAULT 0.00,
                qr_token varchar(64) NOT NULL,
                status varchar(20) NOT NULL DEFAULT 'active',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY qr_token (qr_token),
                UNIQUE KEY unique_assignment (reseller_id, bd_id, catalog_id),
                KEY reseller_id (reseller_id),
                KEY bd_id (bd_id),
                KEY catalog_id (catalog_id)
            ) $charset_collate;

            CREATE TABLE {$wpdb->prefix}epos_serial_numbers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20) unsigned NOT NULL,
                bd_id bigint(20) DEFAULT NULL,
                reseller_id bigint(20) DEFAULT NULL,
                serial_number varchar(100) NOT NULL,
                product_id bigint(20) unsigned DEFAULT NULL,
                status varchar(20) NOT NULL DEFAULT 'assigned',
                assigned_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                assigned_by bigint(20) unsigned DEFAULT NULL,
                source varchar(20) NOT NULL DEFAULT 'manual',
                PRIMARY KEY  (id),
                UNIQUE KEY serial_number (serial_number),
                KEY order_id (order_id),
                KEY bd_id (bd_id),
                KEY reseller_id (reseller_id),
                KEY status (status)
            ) $charset_collate;
        ";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );

        // Add product_id column to existing tables if missing.
        self::maybe_add_column( $wpdb->prefix . 'epos_commissions', 'product_id', 'bigint(20) unsigned DEFAULT NULL AFTER reference_id' );
        self::maybe_add_column( $wpdb->prefix . 'epos_order_attributions', 'product_id', 'bigint(20) unsigned DEFAULT NULL AFTER order_value' );
        self::maybe_add_column( $wpdb->prefix . 'epos_product_catalog', 'usage_bonus', 'decimal(10,2) NOT NULL DEFAULT 0.00 AFTER default_commission' );

        update_option( 'epos_affiliate_db_version', EPOS_AFFILIATE_VERSION );

        // Backfill BD records for existing Resellers that don't have one yet.
        self::backfill_reseller_bd_records();
    }

    /**
     * Create BD records for any Resellers that don't already have one.
     * This ensures existing Resellers get QR tracking capability.
     */
    private static function backfill_reseller_bd_records() {
        global $wpdb;

        $resellers_table = $wpdb->prefix . 'epos_resellers';
        $bds_table       = $wpdb->prefix . 'epos_bds';

        // Find resellers whose wp_user_id has no BD record.
        $resellers = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT r.* FROM %i r
                 LEFT JOIN %i b ON b.wp_user_id = r.wp_user_id AND r.wp_user_id IS NOT NULL
                 WHERE r.wp_user_id IS NOT NULL AND b.id IS NULL",
                $resellers_table,
                $bds_table
            )
        );

        if ( empty( $resellers ) ) {
            return;
        }

        foreach ( $resellers as $reseller ) {
            $tracking_code = strtoupper( $reseller->slug ) . '-OWNER';

            // Skip if tracking code already exists.
            $exists = $wpdb->get_var(
                $wpdb->prepare( "SELECT id FROM %i WHERE tracking_code = %s", $bds_table, $tracking_code )
            );
            if ( $exists ) {
                continue;
            }

            $qr_token = bin2hex( random_bytes( 16 ) );

            $wpdb->insert( $bds_table, [
                'reseller_id'   => $reseller->id,
                'wp_user_id'    => $reseller->wp_user_id,
                'name'          => $reseller->name,
                'tracking_code' => $tracking_code,
                'qr_token'      => $qr_token,
                'status'        => 'active',
            ] );

            // Create WC tracking coupon if CouponService is available.
            if ( class_exists( '\\EposAffiliate\\Services\\CouponService' ) ) {
                \EposAffiliate\Services\CouponService::create_tracking_coupon(
                    $tracking_code,
                    $reseller->wp_user_id,
                    $reseller->id
                );
            }
        }
    }

    /**
     * Add a column to a table if it doesn't already exist.
     */
    private static function maybe_add_column( $table, $column, $definition ) {
        global $wpdb;

        $exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
                DB_NAME,
                $table,
                $column
            )
        );

        if ( ! $exists ) {
            $wpdb->query( "ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}" );
        }
    }

}
