<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

class LoginRedirect {

    public static function init() {
        add_filter( 'login_redirect', [ self::class, 'redirect_after_login' ], 10, 3 );
        add_filter( 'logout_redirect', [ self::class, 'redirect_after_logout' ], 10, 3 );
        add_action( 'admin_init', [ self::class, 'block_wp_admin' ] );
    }

    /**
     * Redirect BD and Reseller users to their dashboard after login.
     *
     * @param string   $redirect_to Default redirect URL.
     * @param string   $requested   Requested redirect URL.
     * @param \WP_User $user        Logged-in user.
     * @return string
     */
    public static function redirect_after_login( $redirect_to, $requested, $user ) {
        if ( ! $user instanceof \WP_User || is_wp_error( $user ) ) {
            return $redirect_to;
        }

        if ( in_array( 'reseller_manager', $user->roles, true ) ) {
            return home_url( '/my/dashboard/reseller/' );
        }

        if ( in_array( 'bd_agent', $user->roles, true ) ) {
            return home_url( '/my/dashboard/bd/' );
        }

        return $redirect_to;
    }

    /**
     * Redirect BD and Reseller users to the home page after logout.
     */
    public static function redirect_after_logout( $redirect_to, $requested, $user ) {
        if ( ! $user instanceof \WP_User ) {
            return $redirect_to;
        }

        if ( in_array( 'reseller_manager', $user->roles, true ) ||
             in_array( 'bd_agent', $user->roles, true ) ) {
            return home_url();
        }

        return $redirect_to;
    }

    /**
     * Prevent BD and Reseller users from accessing wp-admin.
     * Redirect them to their dashboard instead.
     */
    public static function block_wp_admin() {
        if ( wp_doing_ajax() || wp_doing_cron() ) {
            return;
        }

        $user = wp_get_current_user();

        if ( in_array( 'reseller_manager', $user->roles, true ) ) {
            wp_redirect( home_url( '/my/dashboard/reseller/' ) );
            exit;
        }

        if ( in_array( 'bd_agent', $user->roles, true ) ) {
            wp_redirect( home_url( '/my/dashboard/bd/' ) );
            exit;
        }
    }
}
