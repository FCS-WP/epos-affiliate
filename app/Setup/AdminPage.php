<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

class AdminPage {

    public static function init() {
        add_action( 'admin_menu', [ self::class, 'register_menu' ] );
        add_action( 'admin_enqueue_scripts', [ self::class, 'enqueue_assets' ] );
        add_action( 'admin_enqueue_scripts', [ self::class, 'remove_default_stylesheets' ] );
    }

    public static function register_menu() {
        add_menu_page(
            __( 'EPOS Affiliate', 'epos-affiliate' ),
            __( 'EPOS Affiliate', 'epos-affiliate' ),
            'epos_manage_affiliate',
            'epos-affiliate',
            [ self::class, 'render' ],
            'dashicons-groups',
            30
        );
    }

    public static function render() {
        echo '<div id="epos-affiliate-admin"></div>';
    }

    /**
     * Remove WP default admin stylesheets on our page so MUI renders cleanly.
     */
    public static function remove_default_stylesheets( $hook ) {
        if ( 'toplevel_page_epos-affiliate' !== $hook ) {
            return;
        }

        wp_deregister_style( 'forms' );

        add_action( 'admin_head', function () {
            $admin_url = get_admin_url();
            $styles_to_load = [
                'dashicons',
                'admin-bar',
                'common',
                'admin-menu',
                'dashboard',
                'list-tables',
                'edit',
                'media',
                'themes',
                'nav-menus',
                'wp-pointer',
                'widgets',
                'l10n',
                'buttons',
                'wp-auth-check',
            ];

            $wp_version = get_bloginfo( 'version' );
            $styles_url = $admin_url . 'load-styles.php?c=0&dir=ltr&load=' . implode( ',', $styles_to_load ) . '&ver=' . $wp_version;

            echo '<link rel="stylesheet" href="' . esc_url( $styles_url ) . '" media="all">';
        } );
    }

    public static function enqueue_assets( $hook ) {
        if ( 'toplevel_page_epos-affiliate' !== $hook ) {
            return;
        }

        $asset_file = EPOS_AFFILIATE_PATH . 'dist/admin/admin.asset.php';
        $deps       = [];
        $version    = EPOS_AFFILIATE_VERSION . '.' . filemtime( EPOS_AFFILIATE_PATH . 'dist/admin/admin.js' );

        if ( file_exists( $asset_file ) ) {
            $asset   = require $asset_file;
            $deps    = $asset['dependencies'] ?? [];
        }

        wp_enqueue_script(
            'epos-affiliate-admin',
            EPOS_AFFILIATE_URL . 'dist/admin/admin.js',
            $deps,
            $version,
            true
        );

        $css_file = EPOS_AFFILIATE_PATH . 'dist/admin/admin.css';
        if ( file_exists( $css_file ) ) {
            wp_enqueue_style(
                'epos-affiliate-admin',
                EPOS_AFFILIATE_URL . 'dist/admin/admin.css',
                [],
                $version
            );
        }

        wp_localize_script( 'epos-affiliate-admin', 'eposAffiliate', [
            'apiBase'  => esc_url_raw( rest_url( 'epos-affiliate/v1' ) ),
            'nonce'    => wp_create_nonce( 'wp_rest' ),
            'userId'   => get_current_user_id(),
            'userRole' => self::get_current_role(),
        ] );
    }

    private static function get_current_role() {
        $user = wp_get_current_user();

        if ( in_array( 'administrator', $user->roles, true ) ) {
            return 'administrator';
        }
        if ( in_array( 'reseller_manager', $user->roles, true ) ) {
            return 'reseller_manager';
        }
        if ( in_array( 'bd_agent', $user->roles, true ) ) {
            return 'bd_agent';
        }

        return $user->roles[0] ?? '';
    }
}
