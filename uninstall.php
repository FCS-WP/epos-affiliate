<?php
/**
 * EPOS Affiliate Uninstall
 *
 * Fired when the plugin is deleted from WP Admin.
 * Drops custom tables, removes options, and cleans up roles.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

// Drop custom tables.
$tables = [
    $wpdb->prefix . 'epos_product_assignments',
    $wpdb->prefix . 'epos_product_catalog',
    $wpdb->prefix . 'epos_serial_numbers',
    $wpdb->prefix . 'epos_commissions',
    $wpdb->prefix . 'epos_order_attributions',
    $wpdb->prefix . 'epos_bds',
    $wpdb->prefix . 'epos_resellers',
];

foreach ( $tables as $table ) {
    $wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) );
}

// Remove plugin options.
delete_option( 'epos_affiliate_db_version' );

// Remove custom roles.
remove_role( 'reseller_manager' );
remove_role( 'bd_agent' );

// Remove custom capabilities from admin.
$admin = get_role( 'administrator' );
if ( $admin ) {
    $admin->remove_cap( 'epos_view_reseller_dashboard' );
    $admin->remove_cap( 'epos_view_bd_dashboard' );
    $admin->remove_cap( 'epos_manage_affiliate' );
}

// Clean up coupon meta.
$wpdb->delete( $wpdb->postmeta, [ 'meta_key' => '_is_bd_tracking_coupon' ] );
$wpdb->delete( $wpdb->postmeta, [ 'meta_key' => '_bd_user_id' ] );

// Clean up order meta.
$order_meta_keys = [
    '_bd_coupon_code', '_bd_user_id', '_reseller_id',
    '_attribution_source', '_attribution_medium',
    '_attribution_campaign', '_attribution_content', '_attribution_status',
];
foreach ( $order_meta_keys as $key ) {
    $wpdb->delete( $wpdb->postmeta, [ 'meta_key' => $key ] );
}

// Clean up transients (rate limiter).
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_epos_rl_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_epos_rl_%'" );
