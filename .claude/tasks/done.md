# Done

## Phase 1 — Core Plugin (Completed 2026-03-30)

### Backend (PHP MVC)
- [x] Plugin bootstrap (`epos-affiliate.php`) with constants, hooks, autoloader
- [x] PSR-4 autoloader (`autoload.php`)
- [x] DB tables installer (`Installer.php`) — resellers, bds, order_attributions, commissions
- [x] Custom WP roles (`Roles.php`) — `reseller_manager`, `bd_agent` with capabilities
- [x] Models — `Reseller`, `BD`, `OrderAttribution`, `Commission`
- [x] Controllers — `ResellerController`, `BDController`, `CommissionController`, `DashboardController`, `SettingsController`, `ExportController`, `ProfileController`, `AuthController`
- [x] Routes — per-resource route files with permission callbacks (`RouteRegistrar`)
- [x] Services — `QRRedirectService`, `CheckoutService` (session-based, no coupon), `OrderAttributionService`, `CouponService`
- [x] Middleware — `RateLimiter` (5/hr per IP for QR endpoint)
- [x] Logger utility (`Logger.php`) — WC-compatible logging to `wc-logs/`
- [x] Login redirect (`LoginRedirect.php`) — role-based redirect + wp-admin blocking
- [x] Admin page registration (`AdminPage.php`) — WP submenu pages with WP CSS deregistration
- [x] Shortcodes (`Shortcodes.php`) — `[epos_affiliate_dashboard]`
- [x] Dashboard template (`DashboardTemplate.php`) — standalone page template, no theme CSS/JS
- [x] Login template — standalone login page at `/my/login/`
- [x] Custom login REST endpoint (`POST /auth/login`)
- [x] Uninstall cleanup (`uninstall.php`)

### QR → Order Flow
- [x] QR redirect: `/my/qr/[TOKEN]` → rate limit → session-based attribution → checkout
- [x] Session-based BD attribution (no coupon displayed to customer)
- [x] Order meta written via `woocommerce_checkout_create_order` hook
- [x] Attribution + commission created on `woocommerce_order_status_processing`
- [x] WC logging for attribution events

### Admin React App (WP Admin)
- [x] MUI v6 theme with EPOS brand colors
- [x] WP submenu page navigation (Resellers, BD Agents, Commissions, Settings, Dashboard)
- [x] Dashboard page — KPIs (revenue, resellers, BDs, pending payouts), sales chart, top resellers, recent transactions
- [x] Reseller CRUD — list + create/edit form (auto-creates BD record for reseller)
- [x] BD CRUD — list + create/edit form (auto QR token + WC coupon)
- [x] Commission list — approve/pay/void + bulk actions
- [x] Settings page — product ID, commission rate (dynamic currency symbol from WC)
- [x] CSV export — commissions, attributions
- [x] WP admin CSS deregistration to prevent MUI conflicts

### Frontend React App (Dashboard)
- [x] MUI v6 theme with EPOS brand colors
- [x] Custom standalone page template (no theme interference)
- [x] Sidebar navigation (desktop) + bottom navigation (mobile)
- [x] Session expiry detection → auto-redirect to login
- [x] Dynamic currency symbol from WooCommerce settings

#### BD Views
- [x] BD Dashboard — QR card + Total Orders (side by side), recent orders (cards on mobile / DataGrid on desktop)
- [x] BD Orders — full order history, search, date filter, export CSV, "Number of units" + "Has achieved usage target" columns
- [x] BD QR Code — large QR, copy link, download PNG, native share
- [x] BD Profile — profile form, photo upload, QR code section

#### Reseller Views
- [x] Reseller Dashboard — KPIs (3 cards), QR tracking card, BD performance rankings, search/date/export
- [x] Reseller BD Performance — ranked agents table with progress bars, "View Orders" per BD
- [x] Reseller BD Orders — drill-down to specific BD's orders, search/filter/export CSV
- [x] Reseller BDs — manage BDs (add/edit/deactivate) from reseller dashboard
- [x] Reseller Profile — profile form, photo upload

### Reseller QR Support
- [x] Auto-create BD record for Resellers (tracking code: `BD-[SLUG]-OWNER`)
- [x] Backfill migration for existing Resellers without BD records
- [x] QR card displayed on Reseller Dashboard
- [x] ProfileController returns BD tracking data for Resellers

### Documentation
- [x] QR → Order flow chart (Mermaid diagram)
- [x] Admin guide (create reseller, create BD, approve commission)
- [x] CLAUDE.md — full architecture, API reference, implementation rules

### UI/UX
- [x] Mobile-responsive layouts (all pages)
- [x] Bottom navigation on mobile (BD + Reseller)
- [x] Collapsible sidebar on desktop
- [x] Custom login page (standalone, EPOS-branded)
- [x] DataGrid with proper row heights, cell alignment
- [x] Export CSV from all list pages
