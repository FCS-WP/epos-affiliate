<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\BD;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\ProductAssignment;
use EposAffiliate\Middleware\RateLimiter;
use EposAffiliate\Services\Logger;

class QRRedirectService {

    /** Cookie name for BD attribution tracking. */
    const COOKIE_NAME = 'epos_bd_attribution';

    /** Cookie lifetime: 24 hours. */
    const COOKIE_EXPIRY = DAY_IN_SECONDS;

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_qr_redirect' ] );
        add_action( 'template_redirect', [ self::class, 'handle_select_product_page' ] );
    }

    /**
     * Intercept /my/qr/[BD_TOKEN].
     *
     * Flow:
     * 1. Look up BD by qr_token
     * 2. Store BD attribution in a cookie immediately (survives browser close)
     * 3. Get effective product assignments for the BD
     * 4. If 1 product → direct add-to-cart + checkout
     * 5. If multiple → redirect to product selection page
     * 6. If 0 products → fallback to global product from settings
     */
    public static function handle_qr_redirect() {
        $request_uri = trim( $_SERVER['REQUEST_URI'], '/' );

        if ( ! preg_match( '#^my/qr/([a-zA-Z0-9]+)$#', $request_uri, $matches ) ) {
            return;
        }

        $token = sanitize_text_field( $matches[1] );
        $ip    = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        Logger::info( "QR scan received. Token: {$token}, IP: {$ip}", 'QR' );

        // Rate limit: 5 requests per IP per hour.
        if ( RateLimiter::is_limited( 'qr_redirect', 5, 3600 ) ) {
            Logger::warning( "Rate limited. IP: {$ip}, Token: {$token}", 'QR' );
            wp_die(
                esc_html__( 'Too many requests. Please try again later.', 'epos-affiliate' ),
                esc_html__( 'Rate Limited', 'epos-affiliate' ),
                [ 'response' => 429 ]
            );
        }

        // Look up BD by token.
        $bd = BD::find_by_token( $token );

        if ( ! $bd || 'active' !== $bd->status ) {
            Logger::warning( "Invalid/inactive BD. Token: {$token}", 'QR' );
            wp_die(
                esc_html__( 'Invalid or expired QR code.', 'epos-affiliate' ),
                esc_html__( 'QR Error', 'epos-affiliate' ),
                [ 'response' => 404 ]
            );
        }

        $reseller = Reseller::find( $bd->reseller_id );

        // Store BD attribution in cookie immediately so it survives browser close.
        self::set_attribution_cookie( $bd, $reseller );

        Logger::info( "QR valid. BD: {$bd->name} (ID: {$bd->id}), Tracking: {$bd->tracking_code}, Cookie set.", 'QR' );

        // Get effective product assignments.
        $assignments = ProductAssignment::effective_for_bd( $bd->id, $bd->reseller_id );
        $active      = array_filter( $assignments, fn( $a ) => $a->status === 'active' );
        $active      = array_values( $active );

        if ( count( $active ) === 1 ) {
            // Single product — direct add-to-cart + checkout.
            $product_id = $active[0]->product_id;
            Logger::info( "Single product assigned. Product: {$product_id}. Direct checkout.", 'QR' );
            self::redirect_to_product( $bd, $reseller, $product_id );
            return;
        }

        if ( count( $active ) > 1 ) {
            // Multiple products — redirect to product selection page.
            Logger::info( "Multiple products assigned (" . count( $active ) . "). Redirecting to selection.", 'QR' );
            self::redirect_to_selection( $bd );
            return;
        }

        // No product assignments — show error.
        Logger::warning( "No product assignments for BD: {$bd->name} (ID: {$bd->id})", 'QR' );
        wp_die(
            esc_html__( 'No products are currently available for this QR code.', 'epos-affiliate' ),
            esc_html__( 'QR Error', 'epos-affiliate' ),
            [ 'response' => 404 ]
        );
    }

    /**
     * Store BD attribution data in a cookie so it persists across browser close.
     * Cookie value: JSON with bd_tracking, bd_user_id, reseller_id, utm params.
     */
    private static function set_attribution_cookie( $bd, $reseller ) {
        $cookie_data = wp_json_encode( [
            'bd_tracking'  => $bd->tracking_code,
            'bd_user_id'   => $bd->wp_user_id,
            'reseller_id'  => $bd->reseller_id,
            'bd_id'        => $bd->id,
            'utm_source'   => 'qr',
            'utm_medium'   => 'bd_referral',
            'utm_campaign' => $reseller ? $reseller->slug : '',
            'utm_content'  => sanitize_title( $bd->name ),
            'timestamp'    => time(),
        ] );

        setcookie(
            self::COOKIE_NAME,
            $cookie_data,
            time() + self::COOKIE_EXPIRY,
            '/',
            '',
            is_ssl(),
            true // httpOnly
        );

        // Also set in $_COOKIE for immediate use in the same request.
        $_COOKIE[ self::COOKIE_NAME ] = $cookie_data;
    }

    /**
     * Read BD attribution data from the cookie.
     * Returns associative array or null if no cookie.
     */
    public static function get_attribution_from_cookie() {
        if ( empty( $_COOKIE[ self::COOKIE_NAME ] ) ) {
            return null;
        }

        $data = json_decode( wp_unslash( $_COOKIE[ self::COOKIE_NAME ] ), true );
        if ( ! is_array( $data ) || empty( $data['bd_tracking'] ) ) {
            return null;
        }

        return $data;
    }

    /**
     * Clear the attribution cookie (after order is placed).
     */
    public static function clear_attribution_cookie() {
        setcookie( self::COOKIE_NAME, '', time() - 3600, '/', '', is_ssl(), true );
        unset( $_COOKIE[ self::COOKIE_NAME ] );
    }

    /**
     * Redirect directly to a product page and then checkout (single product flow).
     */
    private static function redirect_to_product( $bd, $reseller, $product_id ) {
        $product_url = get_permalink( $product_id );
        if ( ! $product_url ) {
            $product_url = home_url( '/my/bluetap/' );
        }

        $redirect_url = add_query_arg( [
            'add-to-cart'    => $product_id,
            'bd_tracking'    => $bd->tracking_code,
            'bd_user_id'     => $bd->wp_user_id,
            'reseller_id'    => $bd->reseller_id,
            'epos_product'   => $product_id,
            'utm_source'     => 'qr',
            'utm_medium'     => 'bd_referral',
            'utm_campaign'   => $reseller ? $reseller->slug : '',
            'utm_content'    => sanitize_title( $bd->name ),
        ], $product_url );

        wp_redirect( esc_url_raw( $redirect_url ) );
        exit;
    }

    /**
     * Redirect to product selection page (multiple products flow).
     * BD info is already stored in cookie, so the selection page can read it.
     */
    private static function redirect_to_selection( $bd ) {
        $selection_url = home_url( '/my/select-product/' );
        wp_redirect( esc_url_raw( $selection_url ) );
        exit;
    }

    /**
     * Intercept /my/select-product/ and render the product selection template.
     * No WP page needed — this is handled directly by URL.
     */
    public static function handle_select_product_page() {
        $request_uri = trim( $_SERVER['REQUEST_URI'], '/' );

        if ( ! preg_match( '#^my/select-product/?$#', $request_uri ) ) {
            return;
        }

        // Check if customer has BD attribution cookie.
        $cookie_data = self::get_attribution_from_cookie();
        if ( ! $cookie_data ) {
            // No cookie — redirect to home.
            wp_redirect( home_url() );
            exit;
        }

        // Render the select-product template.
        $template = EPOS_AFFILIATE_PATH . 'templates/select-product.php';
        if ( file_exists( $template ) ) {
            include $template;
            exit;
        }
    }
}
