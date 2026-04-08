<?php
/**
 * Product Selection Page
 *
 * Shown when a customer scans a QR code linked to a BD/Reseller
 * with multiple products assigned. The customer picks which product to buy.
 *
 * BD attribution data is already stored in a cookie by QRRedirectService.
 */

defined( 'ABSPATH' ) || exit;

// Enqueue select-product assets.
$js_file = EPOS_AFFILIATE_PATH . 'dist/frontend/select-product.js';
$version = EPOS_AFFILIATE_VERSION . '.' . ( file_exists( $js_file ) ? filemtime( $js_file ) : '0' );

wp_enqueue_script(
    'epos-select-product',
    EPOS_AFFILIATE_URL . 'dist/frontend/select-product.js',
    [],
    $version,
    true
);

$css_file = EPOS_AFFILIATE_PATH . 'dist/frontend/select-product.css';
if ( file_exists( $css_file ) ) {
    wp_enqueue_style(
        'epos-select-product',
        EPOS_AFFILIATE_URL . 'dist/frontend/select-product.css',
        [],
        $version
    );
}

wp_localize_script( 'epos-select-product', 'eposSelectProduct', [
    'apiBase'        => rest_url( 'epos-affiliate/v1' ),
    'nonce'          => wp_create_nonce( 'wp_rest' ),
    'homeUrl'        => home_url(),
    'logoUrl'        => EPOS_AFFILIATE_URL . 'assets/logo.webp',
    'currencySymbol' => function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : 'RM',
] );

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Product — EPOS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #080726 0%, #102870 50%, #0a1a4a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #epos-select-product {
            width: 100%;
            max-width: 420px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
    <?php wp_head(); ?>
</head>
<body>
    <div id="epos-select-product"></div>
    <?php wp_footer(); ?>
</body>
</html>
