<?php
/**
 * Plugin Name: EPOS Affiliate
 * Plugin URI:  https://www.epos.com
 * Description: QR-code-based sales attribution and commission tracking for BD resellers.
 * Version:     1.0.0
 * Author:      EPOS
 * Author URI:  https://www.epos.com
 * Text Domain: epos-affiliate
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * WC requires at least: 7.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Plugin constants.
 */
define( 'EPOS_AFFILIATE_VERSION', '1.2.0' );
define( 'EPOS_AFFILIATE_FILE', __FILE__ );
define( 'EPOS_AFFILIATE_PATH', plugin_dir_path( __FILE__ ) );
define( 'EPOS_AFFILIATE_URL', plugin_dir_url( __FILE__ ) );
define( 'EPOS_AFFILIATE_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Autoloader.
 */
require_once EPOS_AFFILIATE_PATH . 'autoload.php';

/**
 * Activation hook — create DB tables and register roles.
 */
register_activation_hook( __FILE__, function () {
    EposAffiliate\Setup\Installer::activate();
    EposAffiliate\Setup\Roles::register();
} );

/**
 * Deactivation hook — remove roles.
 */
register_deactivation_hook( __FILE__, function () {
    EposAffiliate\Setup\Roles::unregister();
} );

/**
 * Boot the plugin after all plugins have loaded (ensures WooCommerce is available).
 */
add_action( 'plugins_loaded', function () {
    // Bail if WooCommerce is not active.
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', function () {
            echo '<div class="notice notice-error"><p>';
            echo esc_html__( 'EPOS Affiliate requires WooCommerce to be installed and active.', 'epos-affiliate' );
            echo '</p></div>';
        } );
        return;
    }

    // Auto-upgrade: run installer if DB version has changed (creates new tables without reactivation).
    $db_version = get_option( 'epos_affiliate_db_version', '' );
    if ( $db_version !== EPOS_AFFILIATE_VERSION ) {
        EposAffiliate\Setup\Installer::activate();
    }

    // Load text domain.
    load_plugin_textdomain( 'epos-affiliate', false, dirname( EPOS_AFFILIATE_BASENAME ) . '/languages' );

    // Register REST API routes.
    add_action( 'rest_api_init', [ EposAffiliate\Routes\RouteRegistrar::class, 'register' ] );

    // Bypass WP cookie nonce check for API-key-authenticated webhook endpoints.
    add_filter( 'rest_authentication_errors', function ( $result ) {
        if ( $result !== null ) {
            return $result; // Zippy core auth plugin already handled it.
        }

        $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
        if ( strpos( $request_uri, '/epos-affiliate/v1/usage-bonus/process' ) !== false ) {
            // Skip cookie nonce validation — this endpoint uses X-API-Key auth.
            return true;
        }

        return $result;
    }, 99 );

    // Register WooCommerce hooks (services).
    EposAffiliate\Services\QRRedirectService::init();
    EposAffiliate\Services\CheckoutService::init();
    EposAffiliate\Services\OrderAttributionService::init();

    // Admin setup.
    if ( is_admin() ) {
        EposAffiliate\Setup\AdminPage::init();
        EposAffiliate\Setup\OrderMetaBox::init();
    }

    // Frontend shortcodes.
    EposAffiliate\Setup\Shortcodes::init();

    // Custom dashboard page template (clean HTML, no theme CSS/JS).
    EposAffiliate\Setup\DashboardTemplate::init();

    // Login/logout redirects for BD and Reseller roles.
    EposAffiliate\Setup\LoginRedirect::init();
} );
