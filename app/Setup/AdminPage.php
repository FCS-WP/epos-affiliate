<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

class AdminPage {

    /**
     * All admin submenu pages.
     */
    const PAGES = [
        'epos-affiliate'              => 'Dashboard',
        'epos-affiliate-resellers'    => 'Resellers',
        'epos-affiliate-bds'          => 'BD Agents',
        'epos-affiliate-commissions'    => 'Commissions',
        'epos-affiliate-serial-numbers' => 'Serial Numbers',
        'epos-affiliate-products'       => 'Products',
        'epos-affiliate-usage-bonus'    => 'Usage Bonus',
    ];

    public static function init() {
        add_action( 'admin_menu', [ self::class, 'register_menu' ] );
        add_action( 'admin_enqueue_scripts', [ self::class, 'enqueue_assets' ] );
        add_action( 'admin_enqueue_scripts', [ self::class, 'remove_default_stylesheets' ] );
    }

    public static function register_menu() {
        // Parent menu.
        add_menu_page(
            __( 'EPOS Affiliate', 'epos-affiliate' ),
            __( 'EPOS Affiliate', 'epos-affiliate' ),
            'epos_manage_affiliate',
            'epos-affiliate',
            [ self::class, 'render' ],
            'dashicons-groups',
            30
        );

        // Submenu pages.
        foreach ( self::PAGES as $slug => $title ) {
            add_submenu_page(
                'epos-affiliate',
                __( $title, 'epos-affiliate' ),
                __( $title, 'epos-affiliate' ),
                'epos_manage_affiliate',
                $slug,
                [ self::class, 'render' ]
            );
        }
    }

    public static function render() {
        echo '<div id="epos-affiliate-admin"></div>';
    }

    /**
     * Check if current screen is one of our admin pages.
     */
    private static function is_our_page( $hook ) {
        $our_hooks = [
            'toplevel_page_epos-affiliate',
            'epos-affiliate_page_epos-affiliate-resellers',
            'epos-affiliate_page_epos-affiliate-bds',
            'epos-affiliate_page_epos-affiliate-commissions',
            'epos-affiliate_page_epos-affiliate-serial-numbers',
            'epos-affiliate_page_epos-affiliate-products',
            'epos-affiliate_page_epos-affiliate-usage-bonus',
        ];

        return in_array( $hook, $our_hooks, true );
    }

    /**
     * Get the current admin page slug from the query string.
     */
    private static function get_current_page() {
        $page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : 'epos-affiliate';

        $map = [
            'epos-affiliate'              => 'dashboard',
            'epos-affiliate-resellers'    => 'resellers',
            'epos-affiliate-bds'          => 'bds',
            'epos-affiliate-commissions'    => 'commissions',
            'epos-affiliate-serial-numbers' => 'serial-numbers',
            'epos-affiliate-products'       => 'products',
            'epos-affiliate-usage-bonus'    => 'usage-bonus',
        ];

        return $map[ $page ] ?? 'dashboard';
    }

    /**
     * Remove WP default admin stylesheets on our pages so MUI renders cleanly.
     */
    public static function remove_default_stylesheets( $hook ) {
        if ( ! self::is_our_page( $hook ) ) {
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
        if ( ! self::is_our_page( $hook ) ) {
            return;
        }

        $asset_file = EPOS_AFFILIATE_PATH . 'dist/admin/admin.asset.php';
        $deps       = [];
        $version    = EPOS_AFFILIATE_VERSION . '.' . filemtime( EPOS_AFFILIATE_PATH . 'dist/admin/admin.js' );

        if ( file_exists( $asset_file ) ) {
            $asset = require $asset_file;
            $deps  = $asset['dependencies'] ?? [];
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
            'apiBase'        => esc_url_raw( rest_url( 'epos-affiliate/v1' ) ),
            'nonce'          => wp_create_nonce( 'wp_rest' ),
            'userId'         => get_current_user_id(),
            'userRole'       => self::get_current_role(),
            'currentPage'    => self::get_current_page(),
            'adminUrl'       => admin_url( 'admin.php' ),
            'currency'       => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'MYR',
            'currencySymbol' => function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : 'RM',
            'siteUrl'        => esc_url_raw( home_url() ),
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
