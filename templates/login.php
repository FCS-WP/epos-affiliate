<?php
/**
 * Template Name: EPOS Affiliate Login
 *
 * Custom login page for BD and Reseller users.
 * Bypasses the theme — renders a standalone React login form.
 */

defined( 'ABSPATH' ) || exit;

// If already logged in, redirect to dashboard.
if ( is_user_logged_in() ) {
    $user = wp_get_current_user();

    if ( in_array( 'reseller_manager', $user->roles, true ) ) {
        wp_redirect( home_url( '/my/dashboard/reseller/' ) );
        exit;
    }

    if ( in_array( 'bd_agent', $user->roles, true ) ) {
        wp_redirect( home_url( '/my/dashboard/bd/' ) );
        exit;
    }

    wp_redirect( home_url() );
    exit;
}

// Enqueue login assets.
$version = EPOS_AFFILIATE_VERSION . '.' . filemtime( EPOS_AFFILIATE_PATH . 'dist/frontend/login.js' );

wp_enqueue_script(
    'epos-affiliate-login',
    EPOS_AFFILIATE_URL . 'dist/frontend/login.js',
    [],
    $version,
    true
);

$css_file = EPOS_AFFILIATE_PATH . 'dist/frontend/login.css';
if ( file_exists( $css_file ) ) {
    wp_enqueue_style(
        'epos-affiliate-login',
        EPOS_AFFILIATE_URL . 'dist/frontend/login.css',
        [],
        $version
    );
}

wp_localize_script( 'epos-affiliate-login', 'eposAffiliateLogin', [
    'apiBase'  => rest_url( 'epos-affiliate/v1' ),
    'nonce'    => wp_create_nonce( 'wp_rest' ),
    'homeUrl'  => home_url(),
    'loginUrl' => get_permalink(),
    'logoUrl'  => EPOS_AFFILIATE_URL . 'assets/logo.webp',
] );

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — EPOS Affiliate Portal</title>
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
        #epos-affiliate-login {
            width: 100%;
            max-width: 440px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
    <?php wp_head(); ?>
</head>
<body>
    <div id="epos-affiliate-login"></div>
    <?php wp_footer(); ?>
</body>
</html>
