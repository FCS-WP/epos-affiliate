<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Services\EmailService;
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

    /**
     * POST /auth/forgot-password — Send a password reset code via email.
     */
    public static function forgot_password( WP_REST_Request $request ) {
        $login = sanitize_text_field( $request->get_param( 'login' ) );

        if ( empty( $login ) ) {
            return new WP_REST_Response( [
                'message' => 'Please enter your username or email address.',
            ], 400 );
        }

        // Find the user by login or email.
        $user = is_email( $login ) ? get_user_by( 'email', $login ) : get_user_by( 'login', $login );

        // Always return success to prevent user enumeration.
        $success_message = 'If an account exists with that username or email, a password reset code has been sent.';

        if ( ! $user ) {
            return new WP_REST_Response( [ 'message' => $success_message ], 200 );
        }

        // Only allow BD and Reseller roles.
        $allowed_roles = [ 'reseller_manager', 'bd_agent' ];
        $user_roles    = array_intersect( $allowed_roles, $user->roles );

        if ( empty( $user_roles ) ) {
            return new WP_REST_Response( [ 'message' => $success_message ], 200 );
        }

        // Generate a 6-digit reset code.
        $code    = str_pad( wp_rand( 0, 999999 ), 6, '0', STR_PAD_LEFT );
        $expires = time() + 900; // 15 minutes.

        // Store the code and expiry as user meta.
        update_user_meta( $user->ID, '_epos_reset_code', wp_hash_password( $code ) );
        update_user_meta( $user->ID, '_epos_reset_expires', $expires );
        update_user_meta( $user->ID, '_epos_reset_attempts', 0 );

        // Send the reset email.
        EmailService::send_password_reset( $user->ID, $user->display_name, $code );

        return new WP_REST_Response( [ 'message' => $success_message ], 200 );
    }

    /**
     * POST /auth/reset-password — Verify the reset code and set a new password.
     */
    public static function reset_password( WP_REST_Request $request ) {
        $login    = sanitize_text_field( $request->get_param( 'login' ) );
        $code     = sanitize_text_field( $request->get_param( 'code' ) );
        $password = $request->get_param( 'password' );

        if ( empty( $login ) || empty( $code ) || empty( $password ) ) {
            return new WP_REST_Response( [
                'message' => 'All fields are required.',
            ], 400 );
        }

        if ( strlen( $password ) < 8 ) {
            return new WP_REST_Response( [
                'message' => 'Password must be at least 8 characters long.',
            ], 400 );
        }

        // Find the user.
        $user = is_email( $login ) ? get_user_by( 'email', $login ) : get_user_by( 'login', $login );

        if ( ! $user ) {
            return new WP_REST_Response( [
                'message' => 'Invalid reset code or the code has expired.',
            ], 400 );
        }

        // Check attempt count (max 5 attempts to prevent brute force).
        $attempts = (int) get_user_meta( $user->ID, '_epos_reset_attempts', true );
        if ( $attempts >= 5 ) {
            delete_user_meta( $user->ID, '_epos_reset_code' );
            delete_user_meta( $user->ID, '_epos_reset_expires' );
            delete_user_meta( $user->ID, '_epos_reset_attempts' );

            return new WP_REST_Response( [
                'message' => 'Too many failed attempts. Please request a new reset code.',
            ], 429 );
        }

        // Check expiry.
        $expires = (int) get_user_meta( $user->ID, '_epos_reset_expires', true );
        if ( time() > $expires ) {
            delete_user_meta( $user->ID, '_epos_reset_code' );
            delete_user_meta( $user->ID, '_epos_reset_expires' );
            delete_user_meta( $user->ID, '_epos_reset_attempts' );

            return new WP_REST_Response( [
                'message' => 'Reset code has expired. Please request a new one.',
            ], 400 );
        }

        // Verify the code.
        $stored_hash = get_user_meta( $user->ID, '_epos_reset_code', true );
        if ( ! $stored_hash || ! wp_check_password( $code, $stored_hash ) ) {
            update_user_meta( $user->ID, '_epos_reset_attempts', $attempts + 1 );

            return new WP_REST_Response( [
                'message' => 'Invalid reset code or the code has expired.',
            ], 400 );
        }

        // Code is valid — set the new password.
        wp_set_password( $password, $user->ID );

        // Clean up reset meta.
        delete_user_meta( $user->ID, '_epos_reset_code' );
        delete_user_meta( $user->ID, '_epos_reset_expires' );
        delete_user_meta( $user->ID, '_epos_reset_attempts' );

        return new WP_REST_Response( [
            'message' => 'Password has been reset successfully. You can now log in.',
        ], 200 );
    }
}
