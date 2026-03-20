<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

class Roles {

    /**
     * Register custom roles and capabilities.
     */
    public static function register() {
        add_role( 'reseller_manager', __( 'Reseller Manager', 'epos-affiliate' ), [
            'read'                         => true,
            'epos_view_reseller_dashboard' => true,
            'upload_files'                 => true,
        ] );

        add_role( 'bd_agent', __( 'BD Agent', 'epos-affiliate' ), [
            'read'                    => true,
            'epos_view_bd_dashboard'  => true,
            'upload_files'            => true,
        ] );

        // Grant admin the custom capabilities.
        $admin = get_role( 'administrator' );
        if ( $admin ) {
            $admin->add_cap( 'epos_view_reseller_dashboard' );
            $admin->add_cap( 'epos_view_bd_dashboard' );
            $admin->add_cap( 'epos_manage_affiliate' );
        }
    }

    /**
     * Remove custom roles on deactivation.
     */
    public static function unregister() {
        remove_role( 'reseller_manager' );
        remove_role( 'bd_agent' );

        $admin = get_role( 'administrator' );
        if ( $admin ) {
            $admin->remove_cap( 'epos_view_reseller_dashboard' );
            $admin->remove_cap( 'epos_view_bd_dashboard' );
            $admin->remove_cap( 'epos_manage_affiliate' );
        }
    }
}
