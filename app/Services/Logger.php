<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

class Logger {

    const SOURCE = 'epos-affiliate';

    /**
     * Log an info message.
     */
    public static function info( $message, $context = '' ) {
        self::write( 'info', $message, $context );
    }

    /**
     * Log a warning message.
     */
    public static function warning( $message, $context = '' ) {
        self::write( 'warning', $message, $context );
    }

    /**
     * Log an error message.
     */
    public static function error( $message, $context = '' ) {
        self::write( 'error', $message, $context );
    }

    /**
     * Log a debug message (only when WP_DEBUG is on).
     */
    public static function debug( $message, $context = '' ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            self::write( 'debug', $message, $context );
        }
    }

    /**
     * Write to WooCommerce logs.
     *
     * @param string $level   Log level: debug, info, warning, error.
     * @param string $message Log message.
     * @param string $context Optional prefix like "QR", "Checkout", "Attribution".
     */
    private static function write( $level, $message, $context ) {
        if ( ! function_exists( 'wc_get_logger' ) ) {
            return;
        }

        $prefix = $context ? "[{$context}] " : '';
        $logger = wc_get_logger();
        $logger->{$level}( $prefix . $message, [ 'source' => self::SOURCE ] );
    }
}
