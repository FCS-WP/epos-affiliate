# EPOS Affiliate Plugin

## Overview

WordPress/WooCommerce plugin for QR-code-based sales attribution and commission tracking. BDs (Business Development agents) of resellers get unique QR codes. When customers scan them, purchases are attributed to the BD for commission tracking.

**Site:** epos.com/my/ (WordPress + WooCommerce)
**Plugin slug:** `epos-affiliate`
**Text domain:** `epos-affiliate`
**Minimum PHP:** 7.4
**Requires:** WooCommerce 7.0+

## Architecture — MVC + React SPA

The plugin follows an **MVC pattern** on the PHP side, with **React + MUI** frontends (admin + dashboards) that communicate exclusively through the **WP REST API**.

```
epos-affiliate/
├── epos-affiliate.php                  # Bootstrap: constants, hooks, boot
├── autoload.php                        # PSR-4 autoloader (EposAffiliate\ → app/)
├── uninstall.php                       # Cleanup on uninstall
│
├── app/                                # ── PHP MVC backend ──
│   ├── Models/
│   │   ├── Reseller.php                # Reseller CRUD (epos_resellers table)
│   │   ├── BD.php                      # BD CRUD, QR token generation (epos_bds)
│   │   ├── OrderAttribution.php        # Attribution records (epos_order_attributions)
│   │   └── Commission.php             # Commission records (epos_commissions)
│   │
│   ├── Controllers/
│   │   ├── ResellerController.php      # REST: /epos-affiliate/v1/resellers
│   │   ├── BDController.php            # REST: /epos-affiliate/v1/bds
│   │   ├── CommissionController.php    # REST: /epos-affiliate/v1/commissions
│   │   ├── DashboardController.php     # REST: /epos-affiliate/v1/dashboard (KPIs, tables)
│   │   ├── SettingsController.php      # REST: /epos-affiliate/v1/settings
│   │   ├── ExportController.php        # REST: /epos-affiliate/v1/export (CSV downloads)
│   │   └── ProfileController.php       # REST: /epos-affiliate/v1/profile (user profile)
│   │
│   ├── Routes/                         # ── One file per resource ──
│   │   ├── RouteRegistrar.php          # Loads all route files, shared permission callbacks
│   │   ├── ResellerRoutes.php          # /resellers endpoints
│   │   ├── BDRoutes.php                # /bds endpoints
│   │   ├── CommissionRoutes.php        # /commissions endpoints
│   │   ├── DashboardRoutes.php         # /dashboard endpoints (role-scoped)
│   │   ├── SettingsRoutes.php          # /settings endpoints
│   │   ├── ExportRoutes.php            # /export endpoints
│   │   └── ProfileRoutes.php           # /profile endpoints
│   │
│   ├── Services/
│   │   ├── QRRedirectService.php       # template_redirect hook: /my/qr/[token] resolution
│   │   ├── CheckoutService.php         # Session-based BD attribution (no coupon on checkout)
│   │   ├── OrderAttributionService.php # woocommerce_order_status_processing hook
│   │   └── CouponService.php           # WC coupon creation/management for BD records
│   │
│   ├── Middleware/
│   │   └── RateLimiter.php             # Rate-limit QR endpoint (5/hr per IP)
│   │
│   └── Setup/
│       ├── Installer.php               # DB table creation on activation
│       ├── Roles.php                   # Register custom WP roles & capabilities
│       ├── AdminPage.php               # WP admin menu page, enqueue React admin app
│       ├── Shortcodes.php              # [epos_affiliate_dashboard] shortcode
│       └── LoginRedirect.php           # Post-login redirect for BD/Reseller roles
│
├── resources/                          # ── React frontends (MUI v6) ──
│   ├── admin/                          # WP Admin React app
│   │   ├── src/
│   │   │   ├── main.jsx                # Entry point, mount to #epos-affiliate-admin
│   │   │   ├── App.jsx                 # Router: resellers | bds | commissions | settings
│   │   │   ├── theme.js                # MUI theme (EPOS brand colors)
│   │   │   ├── api/
│   │   │   │   └── client.js           # Fetch wrapper with WP nonce
│   │   │   ├── pages/
│   │   │   │   ├── Resellers/
│   │   │   │   │   ├── ResellerList.jsx
│   │   │   │   │   └── ResellerForm.jsx
│   │   │   │   ├── BDs/
│   │   │   │   │   ├── BDList.jsx
│   │   │   │   │   └── BDForm.jsx
│   │   │   │   ├── Commissions/
│   │   │   │   │   └── CommissionList.jsx
│   │   │   │   └── Settings/
│   │   │   │       └── Settings.jsx
│   │   │   └── components/
│   │   │       ├── KPICard.jsx
│   │   │       ├── StatusChip.jsx
│   │   │       ├── PageHeader.jsx
│   │   │       ├── DateRangeFilter.jsx
│   │   │       └── EmptyState.jsx
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── frontend/                       # Frontend dashboard React app
│       ├── src/
│       │   ├── main.jsx                # Entry point, mount to #epos-affiliate-dashboard
│       │   ├── App.jsx                 # Router: dashboard + profile (role-based)
│       │   ├── theme.js                # MUI theme (EPOS brand colors)
│       │   ├── api/
│       │   │   └── client.js           # Fetch wrapper with WP nonce
│       │   ├── pages/
│       │   │   ├── ResellerDashboard/
│       │   │   │   └── ResellerDashboard.jsx   # KPIs + BD performance rankings
│       │   │   ├── BDDashboard/
│       │   │   │   └── BDDashboard.jsx          # Own stats + QR code + order history
│       │   │   ├── ResellerProfile/
│       │   │   │   └── ResellerProfile.jsx      # Reseller profile + photo
│       │   │   └── BDProfile/
│       │   │       └── BDProfile.jsx             # BD profile + QR code display
│       │   └── components/
│       │       ├── KPICard.jsx
│       │       ├── StatusChip.jsx
│       │       ├── DateRangeFilter.jsx
│       │       ├── EmptyState.jsx
│       │       └── ProfileForm.jsx
│       ├── package.json
│       └── vite.config.js
│
├── dist/                               # ── Built React assets (git-tracked) ──
│   ├── admin/
│   │   ├── admin.js
│   │   └── admin.css
│   └── frontend/
│       ├── frontend.js
│       └── frontend.css
│
└── languages/
```

### Layer Responsibilities

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Model** (`app/Models/`) | Database queries, data validation, business objects | Only layer that touches `$wpdb`. Returns `stdClass` objects (from `get_row()`) or arrays. Never HTTP responses. |
| **Controller** (`app/Controllers/`) | REST API endpoints — parse request, call model/service, return `WP_REST_Response` | No direct DB queries. Permission callbacks handle auth. Always return JSON. |
| **Service** (`app/Services/`) | WooCommerce hooks, business logic that spans multiple models | Orchestrates models. Hooks into WC lifecycle. No HTTP concerns. |
| **Route** (`app/Routes/`) | REST route registration and permission callbacks | One file per resource. Shared `can_manage()`, `can_view_reseller_dashboard()`, `can_view_bd_dashboard()`, `can_view_own_profile()` callbacks in RouteRegistrar. |
| **View** (`resources/`) | React SPAs for admin and frontend dashboards | Communicates with PHP exclusively via REST API. Uses MUI v6 components. No server-rendered HTML for data. |

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | MUI (Material UI) | v6.5 |
| Data Grid | MUI X Data Grid | v7.29 |
| Date Pickers | MUI X Date Pickers | v7.29 |
| React | React | v18.3 |
| Routing | React Router DOM | v6.28+ |
| Date Utils | Day.js | v1.11 |
| QR Code | react-qr-code | v2.0 (frontend only) |
| Bundler | Vite | v6.0 |
| CSS-in-JS | Emotion | v11.14 |

### EPOS Brand Theme

```js
// Colors used in MUI theme (theme.js)
Primary:   #102870  // Navy blue
Secondary: #2EAF7D  // Green
Tertiary:  #080726  // Dark navy (used for backgrounds)
Neutral:   #717171  // Gray
Error:     #D32F2F  // Red
Warning:   #ED6C02  // Orange
```

### REST API Endpoints

Base namespace: `epos-affiliate/v1`

#### Admin Endpoints (require `epos_manage_affiliate` capability)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/resellers` | List all resellers (paginated) |
| POST | `/resellers` | Create reseller + WP user |
| GET | `/resellers/{id}` | Get reseller details |
| PUT | `/resellers/{id}` | Update reseller |
| DELETE | `/resellers/{id}` | Deactivate reseller |
| GET | `/bds` | List BDs (filterable by reseller_id) |
| POST | `/bds` | Create BD + WP user + WC coupon + QR token |
| GET | `/bds/{id}` | Get BD details |
| PUT | `/bds/{id}` | Update BD |
| DELETE | `/bds/{id}` | Deactivate BD + disable coupon |
| GET | `/commissions` | List commissions (filterable) |
| PUT | `/commissions/{id}` | Update status (approve/pay/void) |
| POST | `/commissions/bulk` | Bulk update commission statuses |
| GET | `/settings` | Get plugin settings |
| PUT | `/settings` | Update plugin settings |
| GET | `/export/commissions` | CSV download of commissions |
| GET | `/export/attributions` | CSV download of order attributions |

#### Dashboard Endpoints (role-scoped)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard/reseller` | KPIs + BD performance table | `epos_view_reseller_dashboard` (own reseller only) |
| GET | `/dashboard/reseller/export` | CSV export | `epos_view_reseller_dashboard` |
| GET | `/dashboard/bd` | Own stats + order history | `epos_view_bd_dashboard` (own data only) |

#### Profile Endpoints (any authenticated BD/Reseller/Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get current user's profile (role-specific data included) |
| PUT | `/profile` | Update profile (display name, email) |
| POST | `/profile/photo` | Upload profile photo |

### React ↔ WP REST Auth

Both React apps authenticate using the **WP REST API nonce** pattern:

```php
// PHP: enqueue script with localized data
wp_localize_script('epos-affiliate-admin', 'eposAffiliate', [
    'apiBase'  => rest_url('epos-affiliate/v1'),
    'nonce'    => wp_create_nonce('wp_rest'),
    'userId'   => get_current_user_id(),
    'userRole' => $current_role,
    'userName' => $current_user->display_name,
]);
```

```js
// JS: API client sends nonce with every request
const api = {
    get(endpoint, params) { /* fetch with X-WP-Nonce header */ },
    post(endpoint, data)  { /* ... */ },
    put(endpoint, data)   { /* ... */ },
    delete(endpoint)      { /* ... */ },
    download(endpoint, params, filename) { /* blob download for CSV */ },
};
```

### WP Admin Integration

The admin React app mounts inside a WP admin page. `AdminPage.php` **deregisters default WordPress stylesheets** (except essential ones like dashicons, admin-bar, admin-menu) to prevent CSS conflicts with MUI.

```php
// AdminPage::remove_default_stylesheets()
// Deregisters 'forms' stylesheet and loads only essential WP styles
// so MUI components render correctly without WP CSS interference.
```

React HashRouter handles sub-navigation (resellers, BDs, commissions, settings) client-side.

### Frontend Dashboard Integration

Dashboards render via the `[epos_affiliate_dashboard]` shortcode (registered in `Shortcodes.php`).

Place this shortcode on WordPress pages. The React app detects the user's role from `eposAffiliate.userRole` and renders the appropriate dashboard + profile views via HashRouter.

`LoginRedirect.php` handles:
- Post-login redirect: `reseller_manager` → `/my/dashboard/reseller/`, `bd_agent` → `/my/dashboard/bd/`
- Post-logout redirect: → home page
- Blocks wp-admin access for BD/Reseller roles

## Database Tables (prefixed with `{wp_prefix}epos_`)

```sql
-- Resellers
epos_resellers
  id BIGINT AUTO_INCREMENT PRIMARY KEY
  name VARCHAR(255) NOT NULL
  slug VARCHAR(100) UNIQUE NOT NULL
  wp_user_id BIGINT UNSIGNED (FK → wp_users)
  status ENUM('active','inactive') DEFAULT 'active'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

-- BDs (Sales agents)
epos_bds
  id BIGINT AUTO_INCREMENT PRIMARY KEY
  reseller_id BIGINT (FK → epos_resellers.id)
  wp_user_id BIGINT UNSIGNED (FK → wp_users)
  name VARCHAR(255) NOT NULL
  tracking_code VARCHAR(50) UNIQUE NOT NULL  -- e.g. BD-ACME-JS001
  qr_token VARCHAR(64) UNIQUE NOT NULL       -- random 32-char hex for /my/qr/[token]
  status ENUM('active','inactive') DEFAULT 'active'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

-- Order Attribution
epos_order_attributions
  id BIGINT AUTO_INCREMENT PRIMARY KEY
  order_id BIGINT UNSIGNED NOT NULL (FK → WC order ID)
  bd_id BIGINT (FK → epos_bds.id)
  reseller_id BIGINT (FK → epos_resellers.id, denormalized)
  tracking_code VARCHAR(50)
  order_value DECIMAL(10,2)
  attributed_at DATETIME DEFAULT CURRENT_TIMESTAMP

-- Commission Records
epos_commissions
  id BIGINT AUTO_INCREMENT PRIMARY KEY
  bd_id BIGINT (FK → epos_bds.id)
  reseller_id BIGINT (FK → epos_resellers.id)
  type ENUM('sales','usage_bonus')
  reference_id BIGINT                        -- order_id for sales, device_id for usage
  amount DECIMAL(10,2)
  status ENUM('pending','approved','paid','voided') DEFAULT 'pending'
  period_month VARCHAR(7)                    -- e.g. 2026-03
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  paid_at DATETIME NULL
```

## Custom WordPress Roles

| Role | WP Role Slug | Key Capabilities |
|------|-------------|-----------------|
| Reseller Manager | `reseller_manager` | `read`, `epos_view_reseller_dashboard`, `upload_files` |
| BD Agent | `bd_agent` | `read`, `epos_view_bd_dashboard`, `upload_files` |
| Administrator | (existing) | `epos_manage_affiliate`, `epos_view_reseller_dashboard`, `epos_view_bd_dashboard` |

## WooCommerce Order Meta (BD Attribution)

BD attribution is stored as **invisible order meta** — no coupon is displayed to the customer.

| Meta Key | Description | Written By |
|----------|-------------|------------|
| `_bd_coupon_code` | BD tracking code (e.g. `BD-ACME-JS001`) | CheckoutService |
| `_bd_user_id` | BD's WordPress user ID | CheckoutService |
| `_reseller_id` | Reseller ID | CheckoutService |
| `_attribution_source` | UTM source (`qr`) | CheckoutService |
| `_attribution_medium` | UTM medium (`bd_referral`) | CheckoutService |
| `_attribution_campaign` | UTM campaign (reseller slug) | CheckoutService |
| `_attribution_content` | UTM content (BD name) | CheckoutService |
| `_attribution_status` | `attributed` | CheckoutService |
| `_epos_attribution_processed` | `1` (prevents duplicate processing) | OrderAttributionService |

## WooCommerce Coupon Meta (created for BD records, NOT applied to orders)

Coupons are created when BDs are onboarded (for record-keeping and potential future use) but are **not applied during checkout**. BD attribution uses session-based tracking instead.

| Meta Key | Value |
|----------|-------|
| `_bd_user_id` | WordPress user ID of the BD |
| `_reseller_id` | Reseller ID |
| `_is_bd_tracking_coupon` | `true` |

## Key Flows

### QR Code → Checkout Flow (Session-Based, No Coupon)

1. Customer scans QR → hits `https://www.epos.com/my/qr/[BD_TOKEN]`
2. `QRRedirectService.php` intercepts via `template_redirect` hook
3. Rate limits (5/hr per IP via `RateLimiter`)
4. Looks up BD by `qr_token`, validates BD is active
5. Redirects to: `/my/bluetap/?add-to-cart=2174&bd_tracking=[CODE]&bd_user_id=[ID]&reseller_id=[ID]&utm_source=qr&utm_medium=bd_referral&utm_campaign=[RESELLER_SLUG]&utm_content=[BD_NAME]`
6. `CheckoutService.php` intercepts via `template_redirect` on the bluetap page:
   - Empties cart
   - Adds product (BlueTap) qty 1
   - **Stores BD info + UTM params in WC session** (invisible to customer)
   - Redirects to `/my/checkout/`
7. Customer sees standard checkout with BlueTap pre-loaded at RM188
8. **No coupon is visible** — BD attribution is entirely server-side

### Order Attribution Flow

1. Hook: `woocommerce_checkout_create_order` → `CheckoutService::write_attribution_to_order()`
   - Reads BD data from WC session
   - Writes `_bd_coupon_code`, `_bd_user_id`, `_reseller_id`, UTM params directly to order meta
   - Clears session data
2. Hook: `woocommerce_order_status_processing` → `OrderAttributionService::attribute_order()`
   - Reads BD data from order meta (written in step 1)
   - Creates `OrderAttribution` record in DB
   - Creates `Commission` record (status: `pending`)
   - Marks order with `_epos_attribution_processed = 1` to prevent duplicates

### Commission Lifecycle

- **Sales Commission (Phase 1):** Triggered on order `processing` status. Commission = order total (net of tax/shipping) × configured rate. One record per attributed order.
- **Usage Bonus (Phase 2 - April 8):** Monthly. Ops uploads CSV mapping order number → S/N. System checks 3-day activity threshold. Qualifying devices generate bonus commission.
- **Commission States:** `pending` → `approved` → `paid` (or `voided`)
- **Payout:** Manual. Admin exports CSV via `/export/commissions`, finance processes bank transfers, admin marks as `paid` via API.

## Implementation Rules

### PHP Coding Standards
- Follow WordPress Coding Standards (PHP)
- Use `$wpdb->prepare()` for ALL database queries — no exceptions
- Sanitize all inputs: `sanitize_text_field()`, `absint()`, `sanitize_email()`
- Use PHP namespaces: `EposAffiliate\Models`, `EposAffiliate\Controllers`, etc.
- Use WooCommerce CRUD API (not direct post meta) when available
- Models are the ONLY classes that interact with `$wpdb`
- Models return `stdClass` objects from `$wpdb->get_row()` — access with `->` not `[]`
- Controllers MUST use `WP_REST_Response` — never `echo` or `wp_die()`

### React / JS Standards
- Use Vite for bundling both admin and frontend apps
- Use React 18 with functional components and hooks
- Use MUI v6 components (NOT MUI v7 which requires React 19)
- Use MUI X Data Grid v7 for tables, MUI X Date Pickers v7 for dates
- API client must send `X-WP-Nonce` header on every request
- Handle loading, error, and empty states in every data-fetching component
- Use HashRouter for client-side navigation (not BrowserRouter)
- No direct DOM manipulation — all UI through React
- Keep admin and frontend as separate entry points / separate builds
- Follow EPOS brand theme colors (navy #102870, green #2EAF7D)

### Security Requirements
- All REST endpoints MUST have `permission_callback` — never use `__return_true`
- Dashboard API queries scoped to authenticated user's role:
  - BD: only own data (`WHERE bd_id = [current_bd_id]`)
  - Reseller Manager: only own reseller's data (`WHERE reseller_id = [current_reseller_id]`)
  - Admin: all data
- Rate-limit QR landing endpoint: 5 requests per IP per hour via `RateLimiter` middleware
- Validate and sanitize all REST params via `sanitize_callback` and `validate_callback`
- BD attribution is session-based and invisible to customers (no coupon exposed)
- Block wp-admin access for BD/Reseller roles via `LoginRedirect`

### WooCommerce Integration
- BD tracking uses **session-based attribution** — no coupon is applied to the cart/order
- WC coupons are created for BD records (CouponService) but not used during checkout
- Do NOT modify the standard checkout page layout or payment methods
- Hook into existing WooCommerce order flow, don't replace it
- Use `WC()->session` for BD attribution storage during checkout
- Write BD meta to order via `woocommerce_checkout_create_order` hook

### Product Configuration
- BlueTap product ID: `2174` (stored as plugin setting `epos_affiliate_settings.product_id`)
- Support multiple products in architecture (for future Series 1 expansion)
- Tracking code format: `BD-[RESELLER_CODE]-[BD_ID]` (e.g., `BD-ACME-JS001`)

### Build & Dev Workflow

```bash
# Admin app
cd resources/admin && npm install && npm run dev   # dev with HMR
cd resources/admin && npm run build                 # outputs to dist/admin/

# Frontend dashboard app
cd resources/frontend && npm install && npm run dev
cd resources/frontend && npm run build              # outputs to dist/frontend/
```

- Built assets in `dist/` are git-tracked so the plugin works without a build step on the server
- Vite outputs a single JS + CSS bundle per app (IIFE format, not ES module)
- AdminPage.php appends `time()` to script version for cache-busting during development

### Phase 1 Scope (Target: March 25, 2026) — IMPLEMENTED
- **PHP:** Models, Controllers, Routes, Services for resellers, BDs, order attribution, sales commission, profile
- **Admin React:** Reseller CRUD, BD CRUD (with auto coupon + QR token), commission list with approve/pay/void + bulk actions, settings page, CSV export
- **Frontend React:** Reseller Manager dashboard (KPIs + BD performance rankings + date filters + CSV export), BD dashboard (KPIs + QR code + order history), profile pages for both roles
- **Services:** QR redirect (with rate limiting), session-based checkout handler, order attribution, sales commission calc
- **Auth:** Login redirect, wp-admin blocking for BD/Reseller roles

### Phase 2 Scope (Target: April 8, 2026) — TODO
- Usage bonus commission (3-day activity threshold)
- CSV upload for order-to-serial-number mapping
- Series 1 product support
- Usage bonus history in dashboards

### What NOT to Build
- No internal EPOS staff dashboard (use CSV exports)
- No automatic payout processing (manual via finance)
- No refund automation (handled case-by-case by humans)
- No server-rendered HTML for data views — all data flows through REST API to React

## Existing Site Context

- WordPress site at `epos.com/my/`
- WooCommerce checkout at `/my/checkout/`
- BlueTap product page at `/my/bluetap/`
- Existing payment methods: DuitNow, TNG eWallet, Alipay+ (do not modify)
- Other relevant plugins: `epos_payment`, `zippy-pay`, `zippy-core`, `woocommerce`, `advanced-custom-fields-pro`

## Testing

- Test QR flow end-to-end: scan → cart → checkout → order → attribution → commission
- Verify BD attribution meta is written to order (invisible to customer)
- Verify no coupon is visible on checkout page
- Test REST API endpoints with correct and incorrect roles
- Test role-based access: BD cannot hit reseller dashboard API, reseller can't see other resellers
- Test login redirect: BD → `/my/dashboard/bd/`, Reseller → `/my/dashboard/reseller/`
- Test wp-admin blocking for BD/Reseller roles
- Test profile photo upload for BD and Reseller
- Test with existing sitewide promos active (e.g., RM188 pre-order price)
- Verify React apps handle API errors gracefully (401, 403, 500)
- Verify MUI components render correctly (no WordPress CSS conflicts)
