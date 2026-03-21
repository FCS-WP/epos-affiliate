<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

/**
 * Registers a custom page template for the affiliate dashboard.
 *
 * This template bypasses the active theme entirely — no theme CSS/JS,
 * no theme header/footer. The React app gets a clean HTML shell with
 * its own header, footer, and styles (MUI).
 *
 * Usage: In WP Admin → Pages, edit the dashboard page and select
 * "EPOS Affiliate Dashboard" from the Template dropdown.
 */
class DashboardTemplate {

    const TEMPLATE_SLUG = 'epos-affiliate-dashboard';

    public static function init() {
        // Register the template in the page attributes dropdown.
        add_filter( 'theme_page_templates', [ self::class, 'register_template' ], 10, 3 );

        // Load our template file when selected.
        add_filter( 'template_include', [ self::class, 'load_template' ] );
    }

    /**
     * Add our template to the page template dropdown in the editor.
     */
    public static function register_template( $templates, $theme, $post ) {
        $templates[ self::TEMPLATE_SLUG ] = __( 'EPOS Affiliate Dashboard', 'epos-affiliate' );
        return $templates;
    }

    /**
     * If the current page uses our template, load it from the plugin instead of the theme.
     */
    public static function load_template( $template ) {
        global $post;

        if ( ! $post ) {
            return $template;
        }

        $page_template = get_page_template_slug( $post->ID );

        if ( self::TEMPLATE_SLUG !== $page_template ) {
            return $template;
        }

        $plugin_template = EPOS_AFFILIATE_PATH . 'templates/dashboard.php';

        if ( file_exists( $plugin_template ) ) {
            return $plugin_template;
        }

        return $template;
    }
}
