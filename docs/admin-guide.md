# EPOS Affiliate — Admin Guide

## Table of Contents

1. [Product Catalog](#1-product-catalog)
2. [Create a Reseller](#2-create-a-reseller)
3. [Assign Products to Reseller](#3-assign-products-to-reseller)
4. [Create a BD Agent](#4-create-a-bd-agent)
5. [Manage Commissions](#5-manage-commissions)
6. [Deactivate & Reactivate Accounts](#6-deactivate--reactivate-accounts)
7. [QR Codes](#7-qr-codes)
8. [Serial Numbers](#8-serial-numbers)
9. [Troubleshooting](#9-troubleshooting)
10. [Quick Reference](#10-quick-reference)

---

## 1. Product Catalog

Before creating resellers, define the products available in the affiliate program.

### Navigate

Go to **WP Admin → EPOS Affiliate → Products**

### Adding a Product

1. Click **"Add Product"**
2. Fill in:

| Field | Description | Example |
|-------|-------------|---------|
| **Product Label** | Short code used in the affiliate system. Must be unique. | `A01`, `Series 1` |
| **WooCommerce Product** | Select the linked WC product from dropdown | `BlueTap (RM 188.00)` |
| **Default Commission** | Fixed commission amount per order. Can be overridden per reseller. | `RM 20.00` |

3. Click **"Add Product"**

### Editing / Deleting

- Click **Edit** icon to update label, WC product, or default commission
- Click **Delete** icon to remove from catalog

> **Note:** Products in the catalog can be assigned to multiple resellers. Each reseller can have a custom commission amount that overrides the catalog default.

---

## 2. Create a Reseller

### Information needed

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **Reseller Name** | Company or organization name | Yes | `Acme Resellers Sdn Bhd` |
| **Code Prefix** | Uppercase letters/numbers. System auto-numbers. | Yes | `EPOS` → generates `EPOS-01` |
| **Manager Email** | Email for the reseller manager's login account | Yes | `manager@acme.com` |

### Steps

1. Go to **WP Admin → EPOS Affiliate → Resellers**
2. Click **"Add Reseller"**
3. Enter the prefix — the system shows the actual code that will be assigned (e.g., `EPOS-01`)
4. Click **"Create"**

### What happens automatically

- **Reseller code** generated: `[PREFIX]-[NN]` (e.g., `EPOS-01`, `EPOS-02`)
- **WordPress user** created with `reseller_manager` role
- **Branded welcome email** sent with username, password, login link to `/my/login/`
- **BD record** auto-created for the reseller (tracking code: `EPOS-01-OWNER`)
- Dialog stays open in **edit mode** so you can assign products immediately

### After creation

- The "Products" column shows a warning if no products are assigned
- QR code only appears after at least one product is assigned
- Assign products before sharing QR codes with the reseller

---

## 3. Assign Products to Reseller

### Steps

1. In the Resellers list, click **Edit** on a reseller
2. Scroll down to **"Assigned Products"**
3. Click **"Add Product"**
4. Select a product from the catalog dropdown (e.g., `A01 — BlueTap`)
5. Commission auto-fills from catalog default — override if needed for this reseller
6. Click **"Add Product"**

### How it works

- Products come from the **Product Catalog** — no manual label typing
- Each reseller can have different products assigned
- Commission can be customized per reseller (overrides catalog default)
- Commission is inline-editable in the table — click the amount to change it
- All BDs under the reseller inherit these product assignments
- Already-assigned products are filtered out of the dropdown

### Product column in Reseller list

The Resellers list shows product labels as chips (e.g., `A01`, `Series 1`). If no products are assigned, a warning chip `None` appears.

---

## 4. Create a BD Agent

### Prerequisites

- At least one **active reseller** with **products assigned**

### Information needed

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **BD Name** | Full name of the sales agent | Yes | `John Smith` |
| **BD Email** | Email for the BD's login account | Yes | `john@acme.com` |
| **Reseller** | Which reseller this BD belongs to | Yes | `Acme Resellers (EPOS-01)` |

> **Note:** BD code is auto-generated. No manual code entry needed.

### Steps

1. Go to **WP Admin → EPOS Affiliate → BD Agents**
2. Click **"Add BD"**
3. Fill in name, email, select reseller
4. The system shows the tracking code that will be assigned (e.g., `EPOS-01-001`)
5. Click **"Create BD"**

### What happens automatically

- **Tracking code** auto-generated: `[RESELLER_CODE]-[NNN]` (e.g., `EPOS-01-001`)
- **WordPress user** created with `bd_agent` role
- **Branded welcome email** sent with credentials, reseller name, login link
- **QR token** generated for the BD's QR code
- BD inherits all product assignments from their reseller

### QR Code Flow

```
Customer scans QR → /my/qr/[TOKEN]
  → BD attribution stored in cookie (survives browser close, 7 days)
  → If 1 product assigned → direct add-to-cart + checkout
  → If multiple products → product selection page
  → Customer pays normally
  → Order gets BD attribution (invisible to customer)
  → Commission record created (pending)
```

---

## 5. Manage Commissions

### Commission States

```
pending → approved → paid
    ↘         ↘
     voided    voided
```

### Viewing & Filtering

Go to **WP Admin → EPOS Affiliate → Commissions**

Available filters:
- **Reseller** — filter by reseller (BD dropdown auto-filters to match)
- **BD** — filter by specific BD agent
- **Status** — Pending, Approved, Paid, Voided

### Actions

All actions show a **MUI confirmation dialog** before executing:

- **Approve** (checkmark icon) — `pending` → `approved`
- **Mark Paid** (paid icon) — `approved` → `paid`
- **Void** (block icon) — warns "cannot be undone"
- **Bulk actions** — select multiple via checkboxes, then Approve / Mark Paid / Void

### Commission Calculation

Commission is a **fixed amount** per order, configured per product per reseller.

| Source | Example |
|--------|---------|
| Product assignment for reseller | `A01 → RM 20.00` |
| No assignment found | Commission = `RM 0.00` |

### Processing Payout

1. Filter by **Status: Approved**
2. Click **"Export CSV"** — filters are included in the export
3. Send CSV to finance for bank transfers
4. After payment: select commissions → **"Mark Paid"**

---

## 6. Deactivate & Reactivate Accounts

### Deactivating

1. Click the **Deactivate** button (block icon) on the reseller/BD row
2. Confirmation dialog warns "will be logged out immediately"
3. Click **"Deactivate"**

**What happens:**
- Account status → `inactive`
- User immediately logged out → redirected to `/my/login/?account_disabled=1`
- All REST API calls return `403`
- QR code stops working (no products available for inactive accounts)

### Reactivating

1. Click the green **Reactivate** button on inactive accounts
2. Confirm in dialog
3. Account status → `active`, user can log in again

---

## 7. QR Codes

### When QR appears

QR codes only appear when a reseller/BD has **at least one product assigned**. No products = no QR.

### Admin QR Popup

On the Resellers or BD Agents list:
1. Click the **QR icon** in the QR column
2. Popup shows: name, tracking code, QR image, URL
3. **Copy Link** / **Download PNG** / **Share**

### Customer flow (multi-product)

If a BD's reseller has **multiple products** assigned, the customer sees a **product selection page** after scanning:
- Clean branded page with product cards
- Each card shows: product label, WC product name, price
- Customer taps to select → product added to cart → checkout

If only **1 product**, customer goes directly to checkout (no selection page).

---

## 8. Serial Numbers

1. Go to **WP Admin → EPOS Affiliate → Serial Numbers**
2. Click **"Assign S/N"** → enter order number + serial number
3. Or assign from WooCommerce order edit → **EPOS Serial Numbers** metabox

---

## 9. Troubleshooting

### Commission Issues

| Issue | Where to check |
|-------|---------------|
| Commission not created | WooCommerce → Status → Logs → `epos-affiliate` |
| Commission = RM 0.00 | Check product assignment exists for this reseller + product |
| Order has no BD attribution | Check order meta for `_bd_coupon_code` and `_bd_user_id` |
| Duplicate commission | Check `_epos_attribution_processed` meta on the order |

### Account Issues

| Issue | Solution |
|-------|----------|
| Reseller/BD can't log in | Check account status is `active` |
| Welcome email not received | Check spam folder. Verify email in user list |
| User forgot password | "Forgot Password" on login page — 6-digit code via email |
| QR code not showing | Assign products to the reseller first |
| QR scan shows "No products available" | No active product assignments for the BD's reseller |

---

## 10. Quick Reference

### Pilot Checklist

**Before creating any accounts:**
1. Set up Product Catalog (Products page) — add at least one product with label + commission

**To create a Reseller:**
1. Reseller name
2. Code prefix (e.g., `EPOS`)
3. Manager email

**After creating a Reseller:**
1. Assign products from catalog
2. Verify QR code appears
3. Test QR scan → checkout → commission

**To create a BD:**
1. BD name
2. BD email
3. Select reseller (code auto-generated)

### Admin URLs

| Page | URL |
|------|-----|
| Dashboard | `wp-admin/admin.php?page=epos-affiliate` |
| Resellers | `wp-admin/admin.php?page=epos-affiliate-resellers` |
| BD Agents | `wp-admin/admin.php?page=epos-affiliate-bds` |
| Commissions | `wp-admin/admin.php?page=epos-affiliate-commissions` |
| Serial Numbers | `wp-admin/admin.php?page=epos-affiliate-serial-numbers` |
| Products | `wp-admin/admin.php?page=epos-affiliate-products` |

### User Roles

| Role | Login URL | Dashboard URL |
|------|-----------|---------------|
| Admin | `/wp-login.php` | `/wp-admin/` |
| Reseller Manager | `/my/login/` | `/my/dashboard/reseller/` |
| BD Agent | `/my/login/` | `/my/dashboard/bd/` |
