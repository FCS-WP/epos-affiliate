<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\BD;
use EposAffiliate\Models\Reseller;
use EposAffiliate\Middleware\RateLimiter;

class QRRedirectService {

    public static function init() {
        add_action( 'template_redirect', [ self::class, 'handle_qr_redirect' ] );
    }

    /**
     * Intercept /my/qr/[BD_TOKEN] and redirect to the checkout URL with coupon + UTM params.
     */
    public static function handle_qr_redirect() {
        $request_uri = trim( $_SERVER['REQUEST_URI'], '/' );

        // Match pattern: my/qr/{token}
        if ( ! preg_match( '#^my/qr/([a-zA-Z0-9]+)$#', $request_uri, $matches ) ) {
            return;
        }

        // Rate limit: 5 requests per IP per hour.
        if ( RateLimiter::is_limited( 'qr_redirect', 5, 3600 ) ) {
            wp_die(
                esc_html__( 'Too many requests. Please try again later.', 'epos-affiliate' ),
                esc_html__( 'Rate Limited', 'epos-affiliate' ),
                [ 'response' => 429 ]
            );
        }

        $token = sanitize_text_field( $matches[1] );
        $bd    = BD::find_by_token( $token );

        if ( ! $bd || 'active' !== $bd->status ) {
            wp_die(
                esc_html__( 'Invalid or expired QR code.', 'epos-affiliate' ),
                esc_html__( 'QR Error', 'epos-affiliate' ),
                [ 'response' => 404 ]
            );
        }

        $reseller = Reseller::find( $bd->reseller_id );
        $settings = get_option( 'epos_affiliate_settings', [] );
        $product_id = $settings['product_id'] ?? 2174;

        $redirect_url = add_query_arg( [
            'add-to-cart'  => $product_id,
            'coupon'       => $bd->tracking_code,
            'utm_source'   => 'qr',
            'utm_medium'   => 'bd_referral',
            'utm_campaign' => $reseller ? $reseller->slug : '',
            'utm_content'  => sanitize_title( $bd->name ),
        ], home_url( '/my/bluetap/' ) );

        wp_redirect( esc_url_raw( $redirect_url ) );
        exit;
    }
}
