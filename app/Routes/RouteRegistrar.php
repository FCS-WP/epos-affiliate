<?php

namespace EposAffiliate\Routes;

defined( 'ABSPATH' ) || exit;

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
    }

    // ── Shared permission callbacks ──

    public static function can_manage() {
        return current_user_can( 'epos_manage_affiliate' );
    }

    public static function can_view_reseller_dashboard() {
        return current_user_can( 'epos_view_reseller_dashboard' );
    }

    public static function can_view_bd_dashboard() {
        return current_user_can( 'epos_view_bd_dashboard' );
    }

    public static function can_view_own_profile() {
        return current_user_can( 'epos_view_reseller_dashboard' )
            || current_user_can( 'epos_view_bd_dashboard' )
            || current_user_can( 'epos_manage_affiliate' );
    }
}
