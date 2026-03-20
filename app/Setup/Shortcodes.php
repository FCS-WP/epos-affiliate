<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

class Shortcodes {

    public static function init() {
        add_shortcode( 'epos_affiliate_dashboard', [ self::class, 'render_dashboard' ] );
    }

    /**
     * Render the frontend dashboard mount point.
     *
     * Usage: Place [epos_affiliate_dashboard] shortcode on pages at
     *        /my/dashboard/reseller/ and /my/dashboard/bd/
     *
     * The React app reads userRole to decide which view to show.
     */
    public static function render_dashboard() {
        if ( ! is_user_logged_in() ) {
            wp_redirect( wp_login_url( get_permalink() ) );
            exit;
        }

        $user = wp_get_current_user();
        $allowed_roles = [ 'administrator', 'reseller_manager', 'bd_agent' ];

        if ( ! array_intersect( $allowed_roles, $user->roles ) ) {
            return '<p>' . esc_html__( 'You do not have permission to view this page.', 'epos-affiliate' ) . '</p>';
        }

        self::enqueue_assets();

        return '<div id="epos-affiliate-dashboard"></div>';
    }

    private static function enqueue_assets() {
        $asset_file = EPOS_AFFILIATE_PATH . 'dist/frontend/frontend.asset.php';
        $deps       = [];
        $version    = EPOS_AFFILIATE_VERSION . '.' . filemtime( EPOS_AFFILIATE_PATH . 'dist/frontend/frontend.js' );

        if ( file_exists( $asset_file ) ) {
            $asset   = require $asset_file;
            $deps    = $asset['dependencies'] ?? [];
        }

        wp_enqueue_script(
            'epos-affiliate-frontend',
            EPOS_AFFILIATE_URL . 'dist/frontend/frontend.js',
            $deps,
            $version,
            true
        );

        $user = wp_get_current_user();
        $role = 'bd_agent';
        if ( in_array( 'administrator', $user->roles, true ) ) {
            $role = 'administrator';
        } elseif ( in_array( 'reseller_manager', $user->roles, true ) ) {
            $role = 'reseller_manager';
        }

        wp_localize_script( 'epos-affiliate-frontend', 'eposAffiliate', [
            'apiBase'  => esc_url_raw( rest_url( 'epos-affiliate/v1' ) ),
            'nonce'    => wp_create_nonce( 'wp_rest' ),
            'userId'   => get_current_user_id(),
            'userRole' => $role,
            'userName' => $user->display_name ?: $user->user_login,
        ] );
    }
}
