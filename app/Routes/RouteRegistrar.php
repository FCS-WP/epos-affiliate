<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\Reseller;
use EposAffiliate\Models\BD;

class RouteRegistrar {

    const API_NAMESPACE = 'epos-affiliate/v1';

    /**
     * Register all route groups.
     */
    public static function register() {
        ResellerRoutes::register();
        BDRoutes::register();
        CommissionRoutes::register();
        DashboardRoutes::register();
        SettingsRoutes::register();
        ExportRoutes::register();
        ProfileRoutes::register();
        AuthRoutes::register();
        SerialNumberRoutes::register();
    }

    // ── Shared permission callbacks ──

    public static function can_manage() {
        return current_user_can( 'epos_manage_affiliate' );
    }

    public static function can_view_reseller_dashboard() {
        if ( ! current_user_can( 'epos_view_reseller_dashboard' ) ) {
            return false;
        }
        // Admins bypass status check.
        if ( current_user_can( 'epos_manage_affiliate' ) ) {
            return true;
        }
        $reseller = Reseller::find_by_user_id( get_current_user_id() );
        return $reseller && $reseller->status === 'active';
    }

    public static function can_view_bd_dashboard() {
        if ( ! current_user_can( 'epos_view_bd_dashboard' ) ) {
            return false;
        }
        // Admins bypass status check.
        if ( current_user_can( 'epos_manage_affiliate' ) ) {
            return true;
        }
        $bd = BD::find_by_user_id( get_current_user_id() );
        return $bd && $bd->status === 'active';
    }

    public static function can_manage_own_bds() {
        return current_user_can( 'epos_view_reseller_dashboard' )
            || current_user_can( 'epos_manage_affiliate' );
    }

    public static function can_view_own_profile() {
        return current_user_can( 'epos_view_reseller_dashboard' )
            || current_user_can( 'epos_view_bd_dashboard' )
            || current_user_can( 'epos_manage_affiliate' );
    }
}
