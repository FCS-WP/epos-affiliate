<?php

namespace EposAffiliate\Services;

defined( 'ABSPATH' ) || exit;

class EmailService {

    /**
     * Send welcome email to a new Reseller account.
     *
     * @param int    $wp_user_id WordPress user ID.
     * @param string $name       Display name.
     * @param string $password   Plain-text password.
     */
    public static function send_reseller_welcome( $wp_user_id, $name, $password ) {
        $user      = get_userdata( $wp_user_id );
        $login_url = home_url( '/my/login/' );
        $dashboard = home_url( '/my/dashboard/reseller/' );

        $subject = sprintf( '[%s] Your Reseller Account Has Been Created', get_bloginfo( 'name' ) );

        $message = self::build_html(
            'Welcome to EPOS Affiliate Portal',
            $name,
            [
                "Your Reseller Manager account has been created. You can now log in to manage your BD agents and track sales performance.",
                self::credentials_block( $user->user_login, $password ),
                self::button( 'Log In to Your Dashboard', $login_url ),
                "<p style=\"font-size: 13px; color: #717171;\">After logging in, you'll be redirected to your Reseller Dashboard at:<br><a href=\"{$dashboard}\">{$dashboard}</a></p>",
                "<p style=\"font-size: 13px; color: #717171;\">For security, we recommend changing your password after your first login via your Profile page.</p>",
            ]
        );

        self::send( $user->user_email, $subject, $message );
    }

    /**
     * Send welcome email to a new BD account.
     *
     * @param int    $wp_user_id    WordPress user ID.
     * @param string $name          Display name.
     * @param string $password      Plain-text password.
     * @param string $reseller_name Reseller company name.
     */
    public static function send_bd_welcome( $wp_user_id, $name, $password, $reseller_name = '' ) {
        $user      = get_userdata( $wp_user_id );
        $login_url = home_url( '/my/login/' );
        $dashboard = home_url( '/my/dashboard/bd/' );

        $subject = sprintf( '[%s] Your BD Agent Account Has Been Created', get_bloginfo( 'name' ) );

        $reseller_line = $reseller_name
            ? "<p>You have been added as a BD Agent under <strong>{$reseller_name}</strong>.</p>"
            : "<p>Your BD Agent account has been created.</p>";

        $message = self::build_html(
            'Welcome to EPOS Affiliate Portal',
            $name,
            [
                $reseller_line . " You can now log in to view your QR code, track your orders, and monitor your sales performance.",
                self::credentials_block( $user->user_login, $password ),
                self::button( 'Log In to Your Dashboard', $login_url ),
                "<p style=\"font-size: 13px; color: #717171;\">After logging in, you'll be redirected to your BD Dashboard at:<br><a href=\"{$dashboard}\">{$dashboard}</a></p>",
                "<p style=\"font-size: 13px; color: #717171;\">For security, we recommend changing your password after your first login via your Profile page.</p>",
            ]
        );

        self::send( $user->user_email, $subject, $message );
    }

    /**
     * Send password reset code email.
     *
     * @param int    $wp_user_id WordPress user ID.
     * @param string $name       Display name.
     * @param string $code       6-digit reset code.
     */
    public static function send_password_reset( $wp_user_id, $name, $code ) {
        $user = get_userdata( $wp_user_id );

        $subject = sprintf( '[%s] Password Reset Code', get_bloginfo( 'name' ) );

        $code_block = '
        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #717171;">Your reset code</p>
            <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #102870; font-family: monospace;">' . esc_html( $code ) . '</p>
        </div>';

        $message = self::build_html(
            'Password Reset',
            $name,
            [
                "<p>We received a request to reset your password for the EPOS Affiliate Portal.</p>",
                "<p>Enter the following code on the reset password page:</p>",
                $code_block,
                "<p style=\"font-size: 13px; color: #717171;\">This code expires in <strong>15 minutes</strong>.</p>",
                "<p style=\"font-size: 13px; color: #717171;\">If you did not request this reset, you can safely ignore this email. Your password will not be changed.</p>",
            ]
        );

        self::send( $user->user_email, $subject, $message );
    }

    /**
     * Send the email using wp_mail with HTML content type.
     */
    private static function send( $to, $subject, $html_message ) {
        $headers = [ 'Content-Type: text/html; charset=UTF-8' ];

        $sent = wp_mail( $to, $subject, $html_message, $headers );

        if ( ! $sent ) {
            Logger::error( 'Failed to send welcome email to: ' . $to );
        }
    }

    /**
     * Build a credentials display block.
     */
    private static function credentials_block( $username, $password ) {
        return '
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px 20px; margin: 16px 0; font-family: monospace;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Username:</strong> ' . esc_html( $username ) . '</p>
            <p style="margin: 0; font-size: 14px;"><strong>Password:</strong> ' . esc_html( $password ) . '</p>
        </div>';
    }

    /**
     * Build a CTA button.
     */
    private static function button( $label, $url ) {
        return '
        <div style="text-align: center; margin: 24px 0;">
            <a href="' . esc_url( $url ) . '" style="
                display: inline-block;
                background-color: #102870;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 6px;
                font-size: 15px;
                font-weight: 600;
            ">' . esc_html( $label ) . '</a>
        </div>';
    }

    /**
     * Build the full HTML email.
     */
    private static function build_html( $title, $recipient_name, $content_blocks ) {
        $site_name = get_bloginfo( 'name' );
        $year      = date( 'Y' );
        $content   = implode( "\n", $content_blocks );

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background-color: #102870; padding: 28px 32px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">' . esc_html( $title ) . '</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
            <p style="font-size: 15px; color: #333;">Hi <strong>' . esc_html( $recipient_name ) . '</strong>,</p>
            ' . $content . '
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 20px 32px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; font-size: 12px; color: #999;">&copy; ' . $year . ' ' . esc_html( $site_name ) . '. All rights reserved.</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #999;">This is an automated message. Please do not reply.</p>
        </div>

    </div>
</body>
</html>';
    }
}
