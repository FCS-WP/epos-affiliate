<?php
/**
 * Template Name: EPOS Affiliate Dashboard
 *
 * A clean page template that bypasses the active theme entirely.
 * No theme CSS, no theme JS, no theme header/footer.
 * Only loads WordPress core + plugin assets for a clean MUI React app.
 */

defined( 'ABSPATH' ) || exit;

// Redirect to login if not authenticated.
if ( ! is_user_logged_in() ) {
    wp_redirect( wp_login_url( get_permalink() ) );
    exit;
}

// Check role permissions.
$user = wp_get_current_user();
$allowed_roles = [ 'administrator', 'reseller_manager', 'bd_agent' ];

if ( ! array_intersect( $allowed_roles, $user->roles ) ) {
    wp_redirect( home_url() );
    exit;
}

// Determine user role.
$role = 'bd_agent';
if ( in_array( 'administrator', $user->roles, true ) ) {
    $role = 'administrator';
} elseif ( in_array( 'reseller_manager', $user->roles, true ) ) {
    $role = 'reseller_manager';
}

// Enqueue frontend assets.
$version = EPOS_AFFILIATE_VERSION . '.' . filemtime( EPOS_AFFILIATE_PATH . 'dist/frontend/frontend.js' );

wp_enqueue_script(
    'epos-affiliate-frontend',
    EPOS_AFFILIATE_URL . 'dist/frontend/frontend.js',
    [],
    $version,
    true
);

$css_file = EPOS_AFFILIATE_PATH . 'dist/frontend/frontend.css';
if ( file_exists( $css_file ) ) {
    wp_enqueue_style(
        'epos-affiliate-frontend',
        EPOS_AFFILIATE_URL . 'dist/frontend/frontend.css',
        [],
        $version
    );
}

wp_localize_script( 'epos-affiliate-frontend', 'eposAffiliate', [
    'apiBase'  => esc_url_raw( rest_url( 'epos-affiliate/v1' ) ),
    'nonce'    => wp_create_nonce( 'wp_rest' ),
    'userId'   => get_current_user_id(),
    'userRole' => $role,
    'userName' => $user->display_name ?: $user->user_login,
    'logoUrl'  => EPOS_AFFILIATE_URL . 'assets/logo.svg',
    'homeUrl'  => home_url(),
    'logoutUrl'=> wp_logout_url( home_url() ),
] );

// Dashboard page title.
$page_title = 'EPOS Dashboard';
if ( $role === 'reseller_manager' ) {
    $page_title = 'EPOS Reseller Portal';
} elseif ( $role === 'bd_agent' ) {
    $page_title = 'EPOS Sales Agent Portal';
}

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html( $page_title ); ?></title>

    <?php
    // Only print our enqueued styles (no theme styles).
    wp_print_styles( [ 'epos-affiliate-frontend' ] );
    ?>

    <style>
        /* ── Base reset for clean MUI rendering ── */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            height: 100%;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #F5F6FA;
            color: #1a1a2e;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* ── Page layout ── */
        .epos-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ── Header ── */
        .epos-header {
            background-color: #080726;
            color: #ffffff;
            padding: 0 24px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 1100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .epos-header__left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .epos-header__logo {
            height: 32px;
            width: auto;
        }

        .epos-header__title {
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.02em;
        }

        .epos-header__right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .epos-header__user {
            font-size: 0.85rem;
            color: rgba(255,255,255,0.8);
        }

        .epos-header__user strong {
            color: #ffffff;
        }

        .epos-header__logout {
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            font-size: 0.8rem;
            padding: 6px 14px;
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 6px;
            transition: all 0.2s;
        }

        .epos-header__logout:hover {
            color: #ffffff;
            border-color: rgba(255,255,255,0.5);
            background-color: rgba(255,255,255,0.08);
        }

        /* ── Main content area ── */
        .epos-main {
            flex: 1;
            width: 100%;
            margin: 0 auto;
        }

        /* ── Footer ── */
        .epos-footer {
            background-color: #080726;
            color: rgba(255,255,255,0.5);
            text-align: center;
            padding: 16px 24px;
            font-size: 0.75rem;
        }

        .epos-footer a {
            color: rgba(255,255,255,0.7);
            text-decoration: none;
        }

        .epos-footer a:hover {
            color: #ffffff;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
            .epos-header {
                padding: 0 16px;
                height: 56px;
            }
            .epos-header__title {
                font-size: 0.95rem;
            }
            .epos-main {
                padding: 16px;
            }
            .epos-header__user {
                display: none;
            }
        }

        /* ── Print ── */
        @media print {
            .epos-header, .epos-footer {
                display: none;
            }
            .epos-main {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="epos-page">

        <!-- ── Header ── -->
        <header class="epos-header">
            <div class="epos-header__left">
                <svg class="epos-header__logo" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="24" font-family="Inter, sans-serif" font-size="22" font-weight="800" fill="#2EAF7D">EPOS</text>
                </svg>
                <span class="epos-header__title"><?php echo esc_html( $page_title ); ?></span>
            </div>
            <div class="epos-header__right">
                <span class="epos-header__user">
                    <?php echo esc_html__( 'Welcome,', 'epos-affiliate' ); ?>
                    <strong><?php echo esc_html( $user->display_name ?: $user->user_login ); ?></strong>
                </span>
                <a href="<?php echo esc_url( wp_logout_url( home_url() ) ); ?>" class="epos-header__logout">
                    <?php echo esc_html__( 'Logout', 'epos-affiliate' ); ?>
                </a>
            </div>
        </header>

        <!-- ── Main content: React app mounts here ── -->
        <main class="epos-main">
            <div id="epos-affiliate-dashboard"></div>
        </main>

        <!-- ── Footer ── -->
        <footer class="epos-footer">
            &copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> EPOS.
            <?php echo esc_html__( 'All rights reserved.', 'epos-affiliate' ); ?>
            &nbsp;&middot;&nbsp;
            <a href="<?php echo esc_url( home_url() ); ?>">
                <?php echo esc_html__( 'Back to EPOS', 'epos-affiliate' ); ?>
            </a>
        </footer>

    </div>

    <?php
    // Only print our enqueued scripts (no theme scripts).
    wp_print_scripts( [ 'epos-affiliate-frontend' ] );
    ?>
</body>
</html>
