<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request;
use WP_REST_Response;

class AuthController {

    /**
     * POST /auth/login — Authenticate a BD or Reseller user.
     */
    public static function login( WP_REST_Request $request ) {
        $login    = sanitize_text_field( $request->get_param( 'login' ) );
        $password = $request->get_param( 'password' );

        if ( empty( $login ) || empty( $password ) ) {
            return new WP_REST_Response( [
                'message' => 'Username/email and password are required.',
            ], 400 );
        }

        // Try to authenticate.
        $user = wp_authenticate( $login, $password );

        if ( is_wp_error( $user ) ) {
            return new WP_REST_Response( [
                'message' => 'Invalid username/email or password.',
            ], 401 );
        }

        // Check if user has an allowed role.
        $allowed_roles = [ 'reseller_manager', 'bd_agent', 'administrator' ];
        $user_roles    = array_intersect( $allowed_roles, $user->roles );

        if ( empty( $user_roles ) ) {
            return new WP_REST_Response( [
                'message' => 'Your account does not have access to this portal.',
            ], 403 );
        }

        // Log the user in (set auth cookies).
        wp_set_current_user( $user->ID );
        wp_set_auth_cookie( $user->ID, true );

        // Determine redirect URL based on role.
        $redirect = home_url();
        if ( in_array( 'reseller_manager', $user->roles, true ) ) {
            $redirect = home_url( '/my/dashboard/reseller/' );
        } elseif ( in_array( 'bd_agent', $user->roles, true ) ) {
            $redirect = home_url( '/my/dashboard/bd/' );
        } elseif ( in_array( 'administrator', $user->roles, true ) ) {
            $redirect = admin_url();
        }

        return new WP_REST_Response( [
            'message'  => 'Login successful.',
            'redirect' => $redirect,
            'user'     => [
                'id'           => $user->ID,
                'display_name' => $user->display_name,
                'role'         => reset( $user_roles ),
            ],
        ], 200 );
    }
}
