<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\BD;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Middleware\RateLimiter;
use EposAffiliate\Services\Logger;

class QRRedirectService {

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_qr_redirect' ] );
    }

    /**
     * Intercept /my/qr/[BD_TOKEN] and redirect to the bluetap page with BD params.
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

        $bd = BD::find_by_token( $token );

        if ( ! $bd || 'active' !== $bd->status ) {
            Logger::warning( "Invalid/inactive BD. Token: {$token}, BD found: " . ( $bd ? "yes (status: {$bd->status})" : 'no' ), 'QR' );
            wp_die(
                esc_html__( 'Invalid or expired QR code.', 'epos-affiliate' ),
                esc_html__( 'QR Error', 'epos-affiliate' ),
                [ 'response' => 404 ]
            );
        }

        $reseller   = Reseller::find( $bd->reseller_id );
        $settings   = get_option( 'epos_affiliate_settings', [] );
        $product_id = $settings['product_id'] ?? 2174;

        Logger::info( "QR valid. BD: {$bd->name} (ID: {$bd->id}), Tracking: {$bd->tracking_code}, Reseller: " . ( $reseller ? $reseller->name : 'N/A' ) . ", Product: {$product_id}", 'QR' );

        $redirect_url = add_query_arg( [
            'add-to-cart'    => $product_id,
            'bd_token'       => $token,
            'bd_tracking'    => $bd->tracking_code,
            'bd_user_id'     => $bd->wp_user_id,
            'reseller_id'    => $bd->reseller_id,
            'utm_source'     => 'qr',
            'utm_medium'     => 'bd_referral',
            'utm_campaign'   => $reseller ? $reseller->slug : '',
            'utm_content'    => sanitize_title( $bd->name ),
        ], home_url( '/my/bluetap/' ) );

        wp_redirect( esc_url_raw( $redirect_url ) );
        exit;
    }

}
