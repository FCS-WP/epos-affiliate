<?php

namespace EposAffiliate\Controllers;

use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\BD;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

defined( 'ABSPATH' ) || exit;

class ProfileController {

    /**
     * Allowed user meta keys for profile fields.
     */
    private static $meta_keys = [
        'epos_affiliate_phone',
        'epos_affiliate_bank_name',
        'epos_affiliate_bank_account_number',
        'epos_affiliate_bank_account_holder',
        'epos_affiliate_address_line_1',
        'epos_affiliate_address_line_2',
        'epos_affiliate_city',
        'epos_affiliate_state',
        'epos_affiliate_postcode',
        'epos_affiliate_profile_photo_id',
    ];

    /**
     * GET /profile — returns current user's profile data.
     */
    public static function get( WP_REST_Request $request ) {
        $user = wp_get_current_user();
        $role = self::get_role( $user );

        $profile = [
            'name'       => $user->display_name,
            'email'      => $user->user_email,
            'avatar_url' => get_avatar_url( $user->ID, [ 'size' => 200 ] ),
            'role'       => $role,
        ];

        // Load all profile meta.
        foreach ( self::$meta_keys as $key ) {
            $short_key            = str_replace( 'epos_affiliate_', '', $key );
            $profile[ $short_key ] = get_user_meta( $user->ID, $key, true );
        }

        // Profile photo URL.
        $photo_id = (int) get_user_meta( $user->ID, 'epos_affiliate_profile_photo_id', true );
        if ( $photo_id ) {
            $profile['profile_photo_url'] = wp_get_attachment_url( $photo_id );
        } else {
            $profile['profile_photo_url'] = get_avatar_url( $user->ID, [ 'size' => 200 ] );
        }

        // Role-specific data.
        if ( $role === 'reseller_manager' || $role === 'administrator' ) {
            $reseller = Reseller::find_by_user_id( $user->ID );
            if ( $reseller ) {
                $profile['reseller_name']   = $reseller->name;
                $profile['reseller_slug']   = $reseller->slug;
                $profile['reseller_status'] = $reseller->status;
                $profile['reseller_id']     = $reseller->id;
            }
        }

        // Both BD agents and Reseller managers can have BD records (Resellers get auto-created BD).
        $bd = BD::find_by_user_id( $user->ID );
        if ( $bd ) {
            $profile['tracking_code'] = $bd->tracking_code;
            $profile['qr_token']      = $bd->qr_token;
            $profile['qr_url']        = site_url( '/my/qr/' . $bd->qr_token );
            $profile['bd_status']     = $bd->status;
            if ( ! isset( $profile['reseller_id'] ) ) {
                $profile['reseller_id'] = $bd->reseller_id;
            }
        }

        return new WP_REST_Response( $profile, 200 );
    }

    /**
     * PUT /profile — update current user's profile.
     */
    public static function update( WP_REST_Request $request ) {
        $user    = wp_get_current_user();
        $params  = $request->get_json_params();
        $updates = [];

        // Update display name.
        if ( isset( $params['name'] ) && $params['name'] !== $user->display_name ) {
            $updates['display_name'] = sanitize_text_field( $params['name'] );
        }

        // Update email.
        if ( isset( $params['email'] ) && $params['email'] !== $user->user_email ) {
            $new_email = sanitize_email( $params['email'] );
            if ( ! is_email( $new_email ) ) {
                return new WP_REST_Response( [ 'message' => 'Invalid email address.' ], 400 );
            }
            if ( email_exists( $new_email ) && email_exists( $new_email ) !== $user->ID ) {
                return new WP_REST_Response( [ 'message' => 'This email is already in use.' ], 400 );
            }
            $updates['user_email'] = $new_email;
        }

        // Apply wp_users updates.
        if ( ! empty( $updates ) ) {
            $updates['ID'] = $user->ID;
            $result = wp_update_user( $updates );
            if ( is_wp_error( $result ) ) {
                return new WP_REST_Response( [ 'message' => $result->get_error_message() ], 400 );
            }
        }

        // Update user meta fields.
        foreach ( self::$meta_keys as $key ) {
            $short_key = str_replace( 'epos_affiliate_', '', $key );
            if ( isset( $params[ $short_key ] ) ) {
                update_user_meta( $user->ID, $key, sanitize_text_field( $params[ $short_key ] ) );
            }
        }

        // Return updated profile.
        return self::get( $request );
    }

    /**
     * POST /profile/photo — upload profile photo.
     */
    public static function upload_photo( WP_REST_Request $request ) {
        $user  = wp_get_current_user();
        $files = $request->get_file_params();

        if ( empty( $files['photo'] ) ) {
            return new WP_REST_Response( [ 'message' => 'No file uploaded.' ], 400 );
        }

        // Require media functions.
        if ( ! function_exists( 'wp_handle_upload' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
        }

        $upload = wp_handle_upload( $files['photo'], [ 'test_form' => false ] );
        if ( isset( $upload['error'] ) ) {
            return new WP_REST_Response( [ 'message' => $upload['error'] ], 400 );
        }

        $attachment = [
            'post_mime_type' => $upload['type'],
            'post_title'     => sanitize_file_name( $files['photo']['name'] ),
            'post_content'   => '',
            'post_status'    => 'inherit',
        ];

        $attach_id = wp_insert_attachment( $attachment, $upload['file'] );
        if ( is_wp_error( $attach_id ) ) {
            return new WP_REST_Response( [ 'message' => 'Failed to save attachment.' ], 500 );
        }

        $metadata = wp_generate_attachment_metadata( $attach_id, $upload['file'] );
        wp_update_attachment_metadata( $attach_id, $metadata );

        // Delete old photo attachment.
        $old_photo_id = (int) get_user_meta( $user->ID, 'epos_affiliate_profile_photo_id', true );
        if ( $old_photo_id ) {
            wp_delete_attachment( $old_photo_id, true );
        }

        update_user_meta( $user->ID, 'epos_affiliate_profile_photo_id', $attach_id );

        return new WP_REST_Response( [
            'profile_photo_id'  => $attach_id,
            'profile_photo_url' => wp_get_attachment_url( $attach_id ),
        ], 200 );
    }

    /**
     * PUT /profile/password — change current user's password.
     * Requires current_password, new_password, confirm_password.
     */
    public static function change_password( WP_REST_Request $request ) {
        $user    = wp_get_current_user();
        $params  = $request->get_json_params();

        $current  = isset( $params['current_password'] ) ? $params['current_password'] : '';
        $new_pass = isset( $params['new_password'] )     ? $params['new_password']     : '';
        $confirm  = isset( $params['confirm_password'] ) ? $params['confirm_password'] : '';

        // All fields required.
        if ( empty( $current ) || empty( $new_pass ) || empty( $confirm ) ) {
            return new WP_REST_Response(
                [ 'message' => 'All password fields are required.' ],
                400
            );
        }

        // Verify current password.
        if ( ! wp_check_password( $current, $user->user_pass, $user->ID ) ) {
            return new WP_REST_Response(
                [ 'message' => 'Current password is incorrect.' ],
                403
            );
        }

        // New password must match confirmation.
        if ( $new_pass !== $confirm ) {
            return new WP_REST_Response(
                [ 'message' => 'New password and confirmation do not match.' ],
                400
            );
        }

        // Minimum length check.
        if ( strlen( $new_pass ) < 8 ) {
            return new WP_REST_Response(
                [ 'message' => 'New password must be at least 8 characters long.' ],
                400
            );
        }

        // Must not be the same as current password.
        if ( $current === $new_pass ) {
            return new WP_REST_Response(
                [ 'message' => 'New password must be different from the current password.' ],
                400
            );
        }

        // Set the new password.
        wp_set_password( $new_pass, $user->ID );

        // wp_set_password destroys all sessions including current.
        // Re-authenticate and set a fresh login cookie so the user stays logged in.
        wp_set_current_user( $user->ID );
        wp_set_auth_cookie( $user->ID, true );

        return new WP_REST_Response(
            [ 'message' => 'Password changed successfully.' ],
            200
        );
    }

    private static function get_role( $user ) {
        if ( in_array( 'administrator', $user->roles, true ) ) {
            return 'administrator';
        }
        if ( in_array( 'reseller_manager', $user->roles, true ) ) {
            return 'reseller_manager';
        }
        if ( in_array( 'bd_agent', $user->roles, true ) ) {
            return 'bd_agent';
        }
        return $user->roles[0] ?? '';
    }
}
