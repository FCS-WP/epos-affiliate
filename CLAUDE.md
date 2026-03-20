# EPOS Affiliate Plugin

## Overview

WordPress/WooCommerce plugin for QR-code-based sales attribution and commission tracking. BDs (Business Development agents) of resellers get unique QR codes. When customers scan them, purchases are attributed to the BD for commission tracking.

**Site:** epos.com/my/ (WordPress + WooCommerce)
**Plugin slug:** `epos-affiliate`
**Text domain:** `epos-affiliate`
**Minimum PHP:** 7.4
**Requires:** WooCommerce 7.0+

## Architecture — MVC + React SPA

The plugin follows an **MVC pattern** on the PHP side, with **React** frontends (admin + dashboards) that communicate exclusively through the **WP REST API**.

```
epos-affiliate/
├── epos-affiliate.php                  # Bootstrap: constants, hooks, boot
├── autoload.php                        # PSR-4 autoloader (EposAffiliate\ → app/)
├── uninstall.php                       # Cleanup on uninstall
│
├── app/                                # ── PHP MVC backend ──
│   ├── Models/
│   │   ├── Reseller.php                # Reseller CRUD (epos_resellers table)
│   │   ├── BD.php                      # BD CRUD, coupon creation, QR token (epos_bds)
│   │   ├── OrderAttribution.php        # Attribution records (epos_order_attributions)
│   │   └── Commission.php             # Commission records (epos_commissions)
│   │
│   ├── Controllers/
│   │   ├── ResellerController.php      # REST: /epos-affiliate/v1/resellers
│   │   ├── BDController.php            # REST: /epos-affiliate/v1/bds
│   │   ├── CommissionController.php    # REST: /epos-affiliate/v1/commissions
│   │   ├── DashboardController.php     # REST: /epos-affiliate/v1/dashboard (KPIs, tables)
│   │   ├── SettingsController.php      # REST: /epos-affiliate/v1/settings
│   │   └── ExportController.php        # REST: /epos-affiliate/v1/export (CSV downloads)
│   │
│   ├── Routes/                         # ── One file per resource ──
│   │   ├── RouteRegistrar.php          # Loads all route files, shared permission callbacks
│   │   ├── ResellerRoutes.php          # /resellers endpoints
│   │   ├── BDRoutes.php                # /bds endpoints
│   │   ├── CommissionRoutes.php        # /commissions endpoints
│   │   ├── DashboardRoutes.php         # /dashboard endpoints (role-scoped)
│   │   ├── SettingsRoutes.php          # /settings endpoints
│   │   └── ExportRoutes.php            # /export endpoints
│   │
│   ├── Services/
│   │   ├── QRRedirectService.php       # template_redirect hook: /my/qr/[token] resolution
│   │   ├── CheckoutService.php         # Cart manipulation, coupon apply, UTM session storage
│   │   ├── OrderAttributionService.php # woocommerce_order_status_processing hook
│   │   ├── CommissionService.php       # Commission calculation logic
│   │   └── CouponService.php           # WC coupon creation/management for BD tracking
│   │
│   ├── Middleware/
│   │   └── RateLimiter.php             # Rate-limit QR endpoint (5/hr per IP)
│   │
│   └── Setup/
│       ├── Installer.php               # DB table creation on activation
│       ├── Roles.php                   # Register custom WP roles & capabilities
│       ├── AdminPage.php               # WP admin menu page, enqueue React admin app
│       └── Shortcodes.php              # [epos_affiliate_dashboard] shortcode
│
├── resources/                          # ── React frontends ──
│   ├── admin/                          # WP Admin React app (reseller/BD/commission mgmt)
│   │   ├── src/
│   │   │   ├── main.jsx                # Entry point, mount to #epos-affiliate-admin
│   │   │   ├── App.jsx                 # Router: resellers | bds | commissions | settings
│   │   │   ├── api/
│   │   │   │   └── client.js           # Axios/fetch wrapper with WP nonce (wpApiSettings)
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
│   │   │   └── components/             # Shared: DataTable, KPICard, Filters, Modal, etc.
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── frontend/                       # Frontend dashboard React app (reseller/BD views)
│       ├── src/
│       │   ├── main.jsx                # Entry point, mount to #epos-affiliate-dashboard
│       │   ├── App.jsx                 # Router: reseller view | bd view (role-based)
│       │   ├── api/
│       │   │   └── client.js           # Fetch wrapper with WP nonce
│       │   ├── pages/
│       │   │   ├── ResellerDashboard/
│       │   │   │   └── ResellerDashboard.jsx   # KPIs + BD performance table + filters
│       │   │   └── BDDashboard/
│       │   │       └── BDDashboard.jsx          # Own stats + order history (Phase 2)
│       │   └── components/
│       ├── package.json
│       └── vite.config.js
│
├── dist/                               # ── Built React assets (git-tracked) ──
│   ├── admin/
│   │   ├── admin.js
│   │   ├── admin.css
│   │   └── admin.asset.php             # WP dependencies array (wp-element, etc.)
│   └── frontend/
│       ├── frontend.js
│       ├── frontend.css
│       └── frontend.asset.php
│
└── languages/
```

### Layer Responsibilities

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Model** (`app/Models/`) | Database queries, data validation, business objects | Only layer that touches `$wpdb`. Returns arrays/objects, never HTTP responses. |
| **Controller** (`app/Controllers/`) | REST API endpoints — parse request, call model/service, return `WP_REST_Response` | No direct DB queries. Permission callbacks handle auth. Always return JSON. |
| **Service** (`app/Services/`) | WooCommerce hooks, business logic that spans multiple models | Orchestrates models. Hooks into WC lifecycle. No HTTP concerns. |
| **View** (`resources/`) | React SPAs for admin and frontend dashboards | Communicates with PHP exclusively via REST API. No server-rendered HTML for data. |

### REST API Endpoints

Base namespace: `epos-affiliate/v1`

#### Admin Endpoints (require `manage_options` capability)

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
| GET | `/qr/{bd_id}` | Get QR code data (URL + base64 image) |

#### Dashboard Endpoints (role-scoped)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard/reseller` | KPIs + BD performance table | `reseller_manager` (own reseller only) |
| GET | `/dashboard/reseller/export` | CSV export | `reseller_manager` |
| GET | `/dashboard/bd` | Own stats + order history | `bd_agent` (own data only) |

### React ↔ WP REST Auth

Both React apps authenticate using the **WP REST API nonce** pattern:

```php
// PHP: enqueue script with localized data
wp_localize_script('epos-affiliate-admin', 'eposAffiliate', [
    'apiBase'  => rest_url('epos-affiliate/v1'),
    'nonce'    => wp_create_nonce('wp_rest'),
    'userId'   => get_current_user_id(),
    'userRole' => $current_role,
]);
```

```js
// JS: API client sends nonce with every request
const apiClient = {
    fetch(endpoint, options = {}) {
        return fetch(`${eposAffiliate.apiBase}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': eposAffiliate.nonce,
                ...options.headers,
            },
        }).then(res => res.json());
    }
};
```

### WP Admin Integration

The admin React app mounts inside a standard WP admin page:

```php
// app/Setup/Routes.php or a dedicated AdminPage class
add_menu_page(
    'EPOS Affiliate',
    'EPOS Affiliate',
    'manage_options',
    'epos-affiliate',
    function() { echo '<div id="epos-affiliate-admin"></div>'; },
    'dashicons-groups',
    30
);
```

React Router handles sub-navigation (resellers, BDs, commissions, settings) client-side within that single admin page.

### Frontend Dashboard Integration

Dashboards render via a **shortcode** that outputs a mount div:

```php
// Shortcode: [epos_affiliate_dashboard]
add_shortcode('epos_affiliate_dashboard', function() {
    if (!is_user_logged_in()) {
        wp_redirect(wp_login_url(get_permalink()));
        exit;
    }
    wp_enqueue_script('epos-affiliate-frontend');
    wp_enqueue_style('epos-affiliate-frontend');
    return '<div id="epos-affiliate-dashboard"></div>';
});
```

Place this shortcode on WordPress pages at `/my/dashboard/reseller/` and `/my/dashboard/bd/`. The React app detects the user's role from `eposAffiliate.userRole` and renders the appropriate view.

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
  qr_token VARCHAR(64) UNIQUE NOT NULL       -- random token for /my/qr/[token]
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
| Reseller Manager | `reseller_manager` | `read`, `epos_view_reseller_dashboard` |
| BD Agent | `bd_agent` | `read`, `epos_view_bd_dashboard` |

## WooCommerce Coupon Meta (on standard WC coupon posts)

| Meta Key | Value |
|----------|-------|
| `_bd_user_id` | WordPress user ID of the BD |
| `_reseller_id` | Reseller ID |
| `_is_bd_tracking_coupon` | `true` |

## WooCommerce Order Meta

| Meta Key | Description |
|----------|-------------|
| `_bd_coupon_code` | Applied BD tracking coupon code |
| `_bd_user_id` | BD's WordPress user ID |
| `_reseller_id` | Reseller ID |
| `_attribution_source` | UTM source (e.g. `qr`) |
| `_attribution_medium` | UTM medium (e.g. `bd_referral`) |
| `_attribution_campaign` | UTM campaign (reseller slug) |
| `_attribution_content` | UTM content (BD slug) |
| `_attribution_status` | `attributed` or `unresolved` |

## Key Flows

### QR Code → Checkout Flow

1. Customer scans QR → hits `https://www.epos.com/my/qr/[BD_TOKEN]`
2. `QRRedirectService.php` intercepts via `template_redirect` hook
3. Looks up BD by `qr_token` using `BD` model
4. Redirects to: `/my/bluetap/?add-to-cart=2174&coupon=[BD_COUPON_CODE]&utm_source=qr&utm_medium=bd_referral&utm_campaign=[RESELLER_SLUG]&utm_content=[BD_SLUG]`
5. `CheckoutService.php` intercepts via `template_redirect` on the bluetap page:
   - Empties cart
   - Adds product 2174 (BlueTap) qty 1
   - Applies the BD coupon (RM0 tracking, no discount)
   - Stores UTM params in WC session
   - Redirects to `/my/checkout/`
6. Customer sees standard checkout with BlueTap pre-loaded at RM188
7. Coupon is hidden/locked via frontend JS so customer can't remove it

### Order Attribution Flow

1. Hook: `woocommerce_order_status_processing` (payment received) in `OrderAttributionService.php`
2. Extract BD coupon from order's applied coupons
3. Look up BD user ID from coupon post meta (`_is_bd_tracking_coupon`, `_bd_user_id`)
4. Write attribution meta to order via `OrderAttribution` model
5. Create commission record via `Commission` model (status: `pending`)

### Commission Calculation

- **Sales Commission (Phase 1):** Triggered on order `processing` status. Commission = order total (net of tax/shipping) × configured rate. One record per attributed order.
- **Usage Bonus (Phase 2 - April 8):** Monthly. Ops uploads CSV mapping order number → S/N. System checks 3-day activity threshold. Qualifying devices generate bonus commission for the attributed BD.
- **Commission States:** `pending` → `approved` → `paid` → `voided`
- **Payout:** Manual. Admin exports CSV via `/export/commissions`, finance processes bank transfers, admin marks as `paid` via API.

## Implementation Rules

### PHP Coding Standards
- Follow WordPress Coding Standards (PHP)
- Use `$wpdb->prepare()` for ALL database queries — no exceptions
- Sanitize all inputs: `sanitize_text_field()`, `absint()`, `sanitize_email()`
- Prefix all functions, classes, hooks, and options with `epos_affiliate_` or `Epos_Affiliate_`
- Use WooCommerce CRUD API (not direct post meta) when available
- Models are the ONLY classes that interact with `$wpdb`
- Controllers MUST use `WP_REST_Response` — never `echo` or `wp_die()`
- Use PHP namespaces: `EposAffiliate\Models`, `EposAffiliate\Controllers`, etc.

### React / JS Standards
- Use Vite for bundling both admin and frontend apps
- Use React 18+ with functional components and hooks
- API client must send `X-WP-Nonce` header on every request
- Handle loading, error, and empty states in every data-fetching component
- Use React Router for client-side navigation within admin SPA
- No direct DOM manipulation — all UI through React
- Keep admin and frontend as separate entry points / separate builds

### Security Requirements
- All REST endpoints MUST have `permission_callback` — never use `__return_true`
- Dashboard API queries scoped to authenticated user's role:
  - BD: only own data (`WHERE bd_id = [current_bd_id]`)
  - Reseller Manager: only own reseller's data (`WHERE reseller_id = [current_reseller_id]`)
  - Admin: all data
- Rate-limit QR landing endpoint: 5 requests per IP per hour via `RateLimiter` middleware
- Validate and sanitize all REST params via `sanitize_callback` and `validate_callback` in route registration

### WooCommerce Integration
- BD tracking coupons: RM0 discount, `individual_use = true`, product restriction to ID 2174
- Do NOT modify the standard checkout page layout or payment methods
- Hook into existing WooCommerce order flow, don't replace it
- Use WC session for UTM parameter storage during checkout

### Product Configuration
- BlueTap product ID: `2174` (store as plugin setting, not hardcoded)
- Support multiple products in architecture (for future Series 1 expansion)
- Coupon format: `BD-[RESELLER_CODE]-[BD_ID]` (e.g., `BD-ACME-JS001`)

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
- Vite config should output a single JS + CSS bundle per app
- Include a `*.asset.php` file for WP script dependencies

### Phase 1 Scope (Target: March 25, 2026)
- **PHP:** Models, Controllers, Services for resellers, BDs, order attribution, sales commission
- **Admin React:** Reseller CRUD, BD CRUD (with auto coupon + QR token), commission list with approve/pay, settings page, CSV export
- **Frontend React:** Reseller Manager dashboard (KPIs + BD performance table + date filters + CSV export)
- **Services:** QR redirect, checkout handler, order attribution, sales commission calc

### Phase 2 Scope (Target: April 8, 2026)
- Usage bonus commission (3-day activity threshold)
- CSV upload for order-to-serial-number mapping
- BD dashboard view (`/my/dashboard/bd/`)
- Series 1 product support
- Usage bonus history in dashboards

### What NOT to Build
- No internal EPOS staff dashboard (use CSV exports for P1)
- No automatic payout processing (manual via finance)
- No refund automation (handled case-by-case by humans)
- No QR code image generation via PHP library initially (can create manually)
- No automatic BD email with QR (optional, skip if tight on time)
- No server-rendered HTML for data views — all data flows through REST API to React

## Existing Site Context

- WordPress site at `epos.com/my/`
- WooCommerce checkout at `/my/checkout/`
- BlueTap product page at `/my/bluetap/`
- Existing payment methods: DuitNow, TNG eWallet, Alipay+ (do not modify)
- Other relevant plugins: `epos_payment`, `zippy-pay`, `zippy-core`, `woocommerce`, `advanced-custom-fields-pro`

## Testing

- Test QR flow end-to-end: scan → cart → checkout → order → attribution → commission
- Test REST API endpoints with correct and incorrect roles
- Test coupon doesn't stack with other promotions
- Test role-based access: BD cannot hit reseller dashboard API, reseller can't see other resellers
- Test with existing sitewide promos active (e.g., RM188 pre-order price)
- Verify React apps handle API errors gracefully (401, 403, 500)
