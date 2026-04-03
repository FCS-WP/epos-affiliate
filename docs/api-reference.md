# EPOS Affiliate — REST API Reference

**Base URL:** `/wp-json/epos-affiliate/v1`

**Authentication:** All endpoints (except `/auth/login`) require the `X-WP-Nonce` header with a valid WordPress REST nonce. External API consumers can use Application Passwords or JWT tokens.

---

## 1. Authentication

### POST `/auth/login`

Login for BD agents and Reseller managers. Public endpoint.

**Request:**
```json
{
  "login": "username_or_email",
  "password": "secret"
}
```

**Response (200):**
```json
{
  "message": "Login successful.",
  "redirect": "/my/dashboard/bd/",
  "user": {
    "id": 123,
    "display_name": "John Smith",
    "role": "bd_agent"
  }
}
```

**Errors:** `400` missing fields, `401` invalid credentials, `403` user lacks required role

---

## 2. Resellers

> Permission: `epos_manage_affiliate`

### GET `/resellers`

List all resellers.

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `active` or `inactive` |

### POST `/resellers`

Create a reseller. Auto-creates a WP user (`reseller_manager` role) and a BD record for the reseller.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Reseller name |
| `slug` | string | Yes | URL-friendly slug |
| `email` | string | No | Creates WP user + sends credentials email |

**Side effects:**
- Creates WP user with role `reseller_manager`
- Auto-creates BD record with tracking code `BD-{SLUG}-OWNER`
- Creates WC tracking coupon
- Sends `wp_new_user_notification` email

### GET `/resellers/{id}`

Get a single reseller.

### PUT `/resellers/{id}`

Update a reseller. Accepts `name`, `slug`, `status`.

### DELETE `/resellers/{id}`

Deactivate a reseller (soft delete).

---

## 3. BD Agents (Admin)

> Permission: `epos_manage_affiliate`

### GET `/bds`

List all BDs.

| Param | Type | Description |
|-------|------|-------------|
| `reseller_id` | int | Filter by reseller |
| `status` | string | Filter: `active` or `inactive` |

### POST `/bds`

Create a BD agent.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | BD name |
| `reseller_id` | int | Yes | Parent reseller ID |
| `bd_code` | string | Yes | BD code (e.g., `JS001`) |
| `email` | string | No | Creates WP user + sends credentials email |

Tracking code format: `BD-{RESELLER_SLUG}-{BD_CODE}`

**Side effects:**
- Creates WP user with role `bd_agent`
- Generates unique `qr_token` for QR redirect URL
- Creates WC tracking coupon

### GET `/bds/{id}`

Get a single BD.

### PUT `/bds/{id}`

Update a BD. Accepts `name`, `status`.

### DELETE `/bds/{id}`

Deactivate a BD. Disables the WC tracking coupon.

---

## 4. BD Agents (Reseller-Scoped)

> Permission: `epos_view_reseller_dashboard` or `epos_manage_affiliate`
> Data scoped to the authenticated reseller's own BDs only.

### GET `/my/bds`

List BDs belonging to the current reseller.

### POST `/my/bds`

Create a BD under the current reseller.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | BD name |
| `bd_code` | string | Yes | BD code |
| `email` | string | Yes | BD agent email |

### PUT `/my/bds/{id}`

Update a BD (name only). Must belong to current reseller.

### DELETE `/my/bds/{id}`

Deactivate a BD. Must belong to current reseller.

---

## 5. Commissions

> Permission: `epos_manage_affiliate`

### GET `/commissions`

List all commissions.

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `pending`, `approved`, `paid`, `voided` |
| `type` | string | `sales`, `usage_bonus` |
| `bd_id` | int | Filter by BD |
| `reseller_id` | int | Filter by reseller |
| `period_month` | string | Filter by period (e.g., `2026-03`) |

**Response includes:** `bd_name`, `reseller_name` (joined from related tables)

### PUT `/commissions/{id}`

Update commission status.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | `pending`, `approved`, `paid`, `voided` |

Auto-sets `paid_at` when status changes to `paid`.

### POST `/commissions/bulk`

Bulk update commission statuses.

```json
{
  "ids": [1, 2, 3],
  "status": "approved"
}
```

---

## 6. Dashboard

### GET `/dashboard/admin`

> Permission: `epos_manage_affiliate`

System-wide dashboard data.

**Response:**
```json
{
  "kpis": {
    "total_revenue": 845000.00,
    "total_orders": 4250,
    "total_resellers": 5,
    "active_resellers": 4,
    "total_bds": 42,
    "active_bds": 38,
    "pending_payouts": 124550.00
  },
  "chart": [
    { "date": "2026-03-01", "revenue": 12500.00, "orders": 15 }
  ],
  "top_resellers": [
    { "name": "KL Global", "revenue": 842000.00, "orders": 1142 }
  ],
  "recent": [
    {
      "order_id": 2386,
      "bd_name": "Shin",
      "reseller": "ACME Corp",
      "value": 188.00,
      "status": "pending",
      "date": "2026-03-20",
      "tracking_code": "BD-ACME-JS001"
    }
  ]
}
```

### GET `/dashboard/reseller`

> Permission: `epos_view_reseller_dashboard` (scoped to own reseller)

| Param | Type | Description |
|-------|------|-------------|
| `date_from` | date | Start date (YYYY-MM-DD) |
| `date_to` | date | End date (YYYY-MM-DD) |
| `bd_id` | int | Filter by specific BD |

**Response:**
```json
{
  "kpis": {
    "total_orders": 50,
    "total_revenue": 12500.00,
    "total_sales_commission": 1250.00,
    "total_usage_bonus": 0.00,
    "active_bd_count": 3
  },
  "bds": [
    {
      "id": 1,
      "name": "John Smith",
      "tracking_code": "BD-ACME-JS001",
      "orders": 10,
      "revenue": 2500.00,
      "sales_commission": 250.00,
      "usage_bonus": 0.00,
      "last_sale_date": "2026-03-25"
    }
  ],
  "bd_list": [{ "id": 1, "name": "John Smith" }]
}
```

### GET `/dashboard/reseller/export`

> Same params and permission as `/dashboard/reseller`

Returns CSV download.

### GET `/dashboard/reseller/bd/{bd_id}/orders`

> Permission: `epos_view_reseller_dashboard` (BD must belong to reseller)

| Param | Type | Description |
|-------|------|-------------|
| `date_from` | date | Start date |
| `date_to` | date | End date |

**Response:**
```json
{
  "bd": { "id": 1, "name": "John Smith", "tracking_code": "BD-ACME-JS001" },
  "orders": [
    {
      "order_id": 2386,
      "date": "2026-03-20",
      "value": 188.00,
      "num_units": 1,
      "usage_target_met": false,
      "commission": 18.80,
      "usage_bonus": 0.00,
      "payout_status": "pending"
    }
  ]
}
```

### GET `/dashboard/reseller/bd/{bd_id}/orders/export`

CSV download of the above data.

### GET `/dashboard/bd`

> Permission: `epos_view_bd_dashboard` (scoped to own BD data only)

| Param | Type | Description |
|-------|------|-------------|
| `date_from` | date | Start date |
| `date_to` | date | End date |

**Response:**
```json
{
  "tracking_code": "BD-ACME-JS001",
  "kpis": { "total_orders": 50, "usage_bonus_last_paid": 0 },
  "orders": [...]
}
```

### GET `/dashboard/bd/export`

CSV download of BD's orders.

---

## 7. Serial Numbers

> Permission: `epos_manage_affiliate`

### GET `/serial-numbers`

List all serial numbers.

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by SN or order ID |
| `status` | string | `assigned`, `activated`, `returned` |
| `order_id` | int | Filter by order |
| `bd_id` | int | Filter by BD |
| `reseller_id` | int | Filter by reseller |
| `date_from` | date | Start date |
| `date_to` | date | End date |

**Response includes:** `bd_name`, `reseller_name` (joined)

### POST `/serial-numbers`

Assign a serial number to an order.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `order_id` | int | Yes | WooCommerce order ID |
| `serial_number` | string | Yes | Unique serial number |

**Validations:**
1. Order must exist and status must be `processing`
2. Serial number must be unique across all orders
3. Assigned count must be less than order item quantity

**Side effects:**
- Auto-fills `bd_id` and `reseller_id` from order attribution
- Adds WC order note
- Logs to `wc-logs/epos-affiliate-*`

### GET `/serial-numbers/order/{order_id}`

Get order details + assigned serial numbers.

**Response:**
```json
{
  "order_id": 2386,
  "order_status": "processing",
  "order_total": "188.00",
  "total_qty": 2,
  "assigned_count": 1,
  "remaining": 1,
  "bd_name": "John Smith",
  "reseller_name": "ACME Corp",
  "bd_id": 5,
  "reseller_id": 2,
  "serial_numbers": [
    {
      "id": 1,
      "serial_number": "SN-ABC-001",
      "status": "assigned",
      "source": "manual",
      "assigned_at": "2026-03-25 14:30:00"
    }
  ]
}
```

### GET `/serial-numbers/check/{serial_number}`

Check if a serial number exists (for real-time validation).

**Response:**
```json
{
  "exists": false,
  "order_id": null
}
```

### POST `/serial-numbers/bulk`

Bulk assign serial numbers. Designed for API integrations and CSV imports.

**Request:**
```json
{
  "items": [
    { "order_id": 2386, "serial_number": "SN-ABC-001" },
    { "order_id": 2386, "serial_number": "SN-ABC-002" },
    { "order_id": 2384, "serial_number": "SN-XYZ-100" }
  ]
}
```

**Response:**
```json
{
  "created": [
    { "id": 1, "order_id": 2386, "serial_number": "SN-ABC-001" },
    { "id": 2, "order_id": 2386, "serial_number": "SN-ABC-002" }
  ],
  "errors": [
    "Item 2: Order #2384 not found or not in processing status."
  ]
}
```

Each item is validated independently. Partial success is allowed. Records are created with `source = 'api'`.

### DELETE `/serial-numbers/{id}`

Remove a serial number. Adds WC order note and logs the action.

---

## 8. Profile

> Permission: `epos_view_reseller_dashboard` or `epos_view_bd_dashboard` or `epos_manage_affiliate`

### GET `/profile`

Get current user's profile. Returns role-specific fields:

- **Reseller managers:** `reseller_name`, `reseller_slug`, `reseller_status`, `reseller_id`, `tracking_code`, `qr_token`, `qr_url`
- **BD agents:** `tracking_code`, `qr_token`, `qr_url`, `bd_status`, `reseller_id`
- **All roles:** `name`, `email`, `phone`, bank details, address, `profile_photo_url`

### PUT `/profile`

Update profile fields: `name`, `email`, `phone`, `bank_name`, `bank_account_number`, `bank_account_holder`, `address_line_1`, `address_line_2`, `city`, `state`, `postcode`.

### POST `/profile/photo`

Upload profile photo. Multipart form data with `photo` file field. Replaces existing photo.

---

## 9. Settings

> Permission: `epos_manage_affiliate`

### GET `/settings`

```json
{
  "product_id": 2174,
  "sales_commission_rate": 10
}
```

### PUT `/settings`

Update settings. `sales_commission_rate` is clamped to 0–100.

---

## 10. Exports

> Permission: `epos_manage_affiliate`

### GET `/export/commissions`

CSV download. Accepts `status`, `type` filters.

### GET `/export/attributions`

CSV download. Accepts `reseller_id`, `bd_id`, `date_from`, `date_to` filters.

---

## Permission Matrix

| Capability | Role | Access |
|------------|------|--------|
| `epos_manage_affiliate` | `administrator` | Full access to all endpoints |
| `epos_view_reseller_dashboard` | `reseller_manager` | Own reseller data, manage own BDs, profile |
| `epos_view_bd_dashboard` | `bd_agent` | Own BD data, profile |

All dashboard queries are server-side scoped — a reseller cannot see other resellers' data, a BD cannot see other BDs' data.

---

## Error Response Format

All errors follow:
```json
{
  "message": "Human-readable error description."
}
```

Status codes: `400` (validation), `401` (unauthenticated), `403` (forbidden), `404` (not found), `500` (server error).
