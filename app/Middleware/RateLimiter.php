<?php

namespace EposAffiliate\Middleware;

defined( 'ABSPATH' ) || exit;

class RateLimiter {

    /**
     * Check if the current IP has exceeded the rate limit.
     *
     * Uses WordPress transients keyed by IP. Simple and works without external deps.
     *
     * @param string $action    Action identifier (e.g. 'qr_redirect').
     * @param int    $max       Maximum requests allowed in the window.
     * @param int    $window    Time window in seconds.
     * @return bool True if rate limited (should block), false if OK.
     */
    public static function is_limited( $action = 'qr_redirect', $max = 5, $window = 3600 ) {
        $ip  = self::get_client_ip();
        $key = 'epos_rl_' . md5( $action . '_' . $ip );

        $data = get_transient( $key );

        if ( false === $data ) {
            // First request in this window.
            set_transient( $key, [ 'count' => 1, 'start' => time() ], $window );
            return false;
        }

        if ( $data['count'] >= $max ) {
            return true;
        }

        // Increment count.
        $data['count']++;
        $remaining = $window - ( time() - $data['start'] );
        if ( $remaining > 0 ) {
            set_transient( $key, $data, $remaining );
        }

        return false;
    }

    /**
     * Get client IP address, considering common proxy headers.
     */
    private static function get_client_ip() {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ( $headers as $header ) {
            if ( ! empty( $_SERVER[ $header ] ) ) {
                $ip = $_SERVER[ $header ];
                // X-Forwarded-For may contain multiple IPs; take the first.
                if ( strpos( $ip, ',' ) !== false ) {
                    $ip = trim( explode( ',', $ip )[0] );
                }
                if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }
}
