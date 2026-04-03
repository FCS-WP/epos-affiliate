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

### Security & Access Control
- [x] Inactive account blocking — deactivated Reseller/BD can no longer access dashboard or API
- [x] `RouteRegistrar` permission callbacks check `status === 'active'` (not just WP capability)
- [x] `LoginRedirect::block_inactive_accounts()` — logs out inactive users, redirects to `/my/login/?account_disabled=1`
- [x] Admin bypass — admins skip status check in permission callbacks

### Serial Numbers (Admin)
- [x] DB table `epos_serial_numbers` — migration in `Installer.php`
- [x] `SerialNumber` model — CRUD, uniqueness check, order lookup
- [x] `SerialNumberController` — REST endpoints (list, assign, delete, bulk)
- [x] `SerialNumberRoutes` — route registration with admin-only permissions
- [x] Admin submenu page "Serial Numbers" — React SPA with DataGrid, assign dialog, search/filter
- [x] WooCommerce order edit metabox — assign/view SNs directly from order edit page
- [x] API documentation (`docs/api.md`)

### Reseller BD Management
- [x] Reseller can add new BDs from dashboard (`POST /my/bds`)
- [x] Reseller can edit BD name (`PUT /my/bds/{id}`)
- [x] Reseller can deactivate BD with MUI confirmation dialog
- [x] Reseller can reactivate BD with MUI confirmation dialog
- [x] QR code dialog — view QR for any BD from Manage BDs page
- [x] `ResellerBDController` — full CRUD scoped to logged-in reseller's BDs
- [x] `api.delete()` method added to frontend API client

### UI/UX Enhancements
- [x] Mobile-responsive layouts (all pages)
- [x] Bottom navigation on mobile (BD + Reseller)
- [x] Collapsible sidebar on desktop
- [x] Custom login page (standalone, EPOS-branded)
- [x] DataGrid with proper row heights, cell alignment
- [x] Export CSV from all list pages
- [x] Removed "By Revenue / By Volume" tabs from Reseller Performance
- [x] Removed "Performance Trend" column from BD performance tables
- [x] Removed "Usage Bonus" column from Reseller BD Orders
- [x] Removed "Usage Target" column from Reseller BD Orders
- [x] Removed commission values from BD view (sales commission hidden)
- [x] "Number of Units" column in order tables + CSV exports

### Admin MUI Confirmation Dialogs
- [x] Commission list — MUI dialogs for Approve, Mark Paid, Void (single + bulk) with icons and loading state
- [x] Reseller list — MUI dialogs for Deactivate/Reactivate with warning messages
- [x] BD list — MUI dialogs for Deactivate/Reactivate with tracking code info

### Admin QR Code Dialogs
- [x] BD list — QR popup dialog (view QR, copy link, download PNG, share)
- [x] Reseller list — QR popup dialog (enriched from auto-created BD record)
- [x] `ResellerController::index()` and `show()` — enrich resellers with `qr_token` and `tracking_code`
- [x] `react-qr-code` installed in admin app
- [x] `siteUrl` added to `wp_localize_script` in `AdminPage.php`

### Custom Email Templates
- [x] `EmailService.php` — branded HTML emails replacing default WP `wp_new_user_notification`
- [x] Reseller welcome email — credentials, login URL to `/my/login/`, dashboard link
- [x] BD welcome email — credentials, reseller name, login URL, dashboard link
- [x] All 3 controllers updated (`ResellerController`, `BDController`, `ResellerBDController`)
- [x] No more default WP email with `/wp-admin/` password reset link

### Change Password
- [x] `PUT /profile/password` REST endpoint with security checks
- [x] Verifies current password with `wp_check_password()`
- [x] Validates: min 8 chars, passwords match, new ≠ current
- [x] Re-authenticates session after `wp_set_password()` so user stays logged in
- [x] ProfileForm — "Change Password" section with show/hide toggles, inline alerts
- [x] Client-side validation mirrors server-side

### Dashboard Access Protection
- [x] `protect_dashboard_pages()` — URL path check + template check for non-logged-in users
- [x] Non-logged-in visitors to `/my/dashboard/bd/` or `/my/dashboard/reseller/` redirect to `/my/login/`

### Bug Fixes
- [x] MUI v7 + React 18 incompatibility — downgraded to MUI v6
- [x] `api.delete` not a function — added `delete` method to frontend API client
- [x] `ProfileController` stdClass array access — fixed `$reseller['name']` to `$reseller->name`
- [x] Serial Numbers admin page blank — added page slug to `AdminPage.php`
- [x] Reseller `/qr` route missing — added QR route for resellers in `RoleRouter`
- [x] CSV export format — fixed single-line CSV output, added proper newlines
- [x] Export button in BD Orders — fixed download endpoint
- [x] Dashboard pages redirect to WP login instead of affiliate login — fixed with URL path check
