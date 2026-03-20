<?php
/**
 * PSR-4 style autoloader for the EposAffiliate namespace.
 *
 * Maps EposAffiliate\Models\Reseller  → app/Models/Reseller.php
 * Maps EposAffiliate\Routes\Resellers → app/Routes/Resellers.php
 * etc.
 */

defined( 'ABSPATH' ) || exit;

spl_autoload_register( function ( $class ) {
    $prefix = 'EposAffiliate\\';

    if ( strpos( $class, $prefix ) !== 0 ) {
        return;
    }

    $relative = substr( $class, strlen( $prefix ) );
    $file     = EPOS_AFFILIATE_PATH . 'app/' . str_replace( '\\', '/', $relative ) . '.php';

    if ( file_exists( $file ) ) {
        require_once $file;
    }
} );
