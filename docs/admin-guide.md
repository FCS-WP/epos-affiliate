# EPOS Affiliate — Admin Guide

## Table of Contents

1. [Create a Reseller](#1-create-a-reseller)
2. [Create a BD Agent](#2-create-a-bd-agent)
3. [Manage Commissions](#3-manage-commissions)
4. [Deactivate & Reactivate Accounts](#4-deactivate--reactivate-accounts)
5. [QR Codes](#5-qr-codes)
6. [Serial Numbers](#6-serial-numbers)
7. [Settings](#7-settings)
8. [Troubleshooting](#8-troubleshooting)
9. [Quick Reference](#9-quick-reference)

---

## 1. Create a Reseller

A Reseller is a partner organization whose BD agents sell EPOS products. Each reseller gets their own login, dashboard, and QR code.

### Information needed

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **Reseller Name** | Company or organization name | Yes | `Acme Resellers Sdn Bhd` |
| **Slug** | Unique identifier (lowercase, hyphens). Used in tracking codes and URLs | Yes | `acme` |
| **Manager Email** | Email for the reseller manager's login account | Yes | `manager@acme.com` |

> **Tip:** Prepare all 3 fields before creating. The slug cannot be changed after creation and must be unique.

### Steps

1. Go to **WP Admin → EPOS Affiliate → Resellers**
2. Click **"Add Reseller"**
3. Fill in the form with the information above
4. Click **"Create"**

### What happens automatically

- A **WordPress user** is created with role `reseller_manager`
- A **branded welcome email** is sent containing:
  - Username and auto-generated password
  - Login link to `/my/login/`
  - Dashboard link to `/my/dashboard/reseller/`
- A **BD record** is auto-created for the reseller (tracking code: `BD-[SLUG]-OWNER`) so they can also use QR tracking
- A **QR code** is generated for the reseller's own tracking

### After creation

- The reseller can log in at `/my/login/` and access their dashboard
- They can view BD performance, manage their BDs, and use their own QR code
- Share the reseller's QR code or let them download it from their dashboard

---

## 2. Create a BD Agent

A BD (Business Development) agent is a field salesperson linked to a reseller. Each BD gets a unique QR code and tracking code for attributing sales.

### Prerequisites

- At least one **active reseller** must exist

### Information needed

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **BD Name** | Full name of the sales agent | Yes | `John Smith` |
| **BD Email** | Email for the BD's login account | Yes | `john@acme.com` |
| **Reseller** | Which reseller this BD belongs to (select from dropdown) | Yes | `Acme Resellers Sdn Bhd` |
| **BD Code** | Short unique code (uppercase, no spaces). Combined with reseller slug to form the tracking code | Yes | `JS001` |

> **Tip:** The system will preview the tracking code as you type. For example, reseller `acme` + BD code `JS001` = tracking code `BD-ACME-JS001`.

### Steps

1. Go to **WP Admin → EPOS Affiliate → BD Agents**
2. Click **"Add BD"**
3. Fill in the form with the information above
4. Verify the **tracking code preview** is correct
5. Click **"Create BD"**

### What happens automatically

- A **WordPress user** is created with role `bd_agent`
- A **branded welcome email** is sent containing:
  - Username and auto-generated password
  - Reseller name they belong to
  - Login link to `/my/login/`
  - Dashboard link to `/my/dashboard/bd/`
- A **tracking code** is generated: `BD-[RESELLER_SLUG]-[BD_CODE]`
- A **QR token** (random 32-character hex) is generated for the QR URL
- A **WooCommerce coupon** is created for record-keeping (not applied to orders)

### After creation

- The BD can log in at `/my/login/` and access their dashboard
- They can view their QR code, orders, and sales performance
- Share the QR code with the BD or let them download it from their dashboard

### QR Code Flow

When a customer scans a BD's QR code:

```
Customer scans QR → /my/qr/[TOKEN]
  → Server validates BD & rate limits (5/hr per IP)
  → Redirects to /my/bluetap/ with BD params
  → Cart cleared, BlueTap product added
  → BD info stored in session (invisible to customer)
  → Redirect to /my/checkout/
  → Customer pays normally
  → Order gets BD attribution in meta (invisible)
  → Commission record created (pending)
```

The customer sees a normal checkout — no coupon, no BD info visible.

---

## 3. Manage Commissions

Commissions are automatically created when a BD-attributed order reaches `processing` status. The admin must review, approve, and mark as paid.

### Commission States

```
pending → approved → paid
    ↘         ↘
     voided    voided
```

| Status | Meaning |
|--------|---------|
| **Pending** | Commission created, awaiting admin review |
| **Approved** | Admin verified the sale is valid, ready for payout |
| **Paid** | Finance has processed the bank transfer |
| **Voided** | Commission cancelled (e.g., fraudulent order, refund) |

### Viewing Commissions

1. Go to **WP Admin → EPOS Affiliate → Commissions**
2. Use filters to narrow the list:
   - **Status**: Pending, Approved, Paid, Voided
   - **Type**: Sales, Usage Bonus

### Approving a Single Commission

1. Find the commission in the list
2. Click the **Approve** button (checkmark icon) in the Actions column
3. A **confirmation dialog** appears showing the commission amount and BD name
4. Click **"Approve"** to confirm
5. The status changes from `pending` → `approved`

### Bulk Approve

1. Select multiple commissions using the checkboxes
2. Click the **"Approve"** button at the top
3. A **confirmation dialog** shows the count of selected commissions
4. Click **"Approve"** to confirm

### Processing Payout

1. Filter commissions by **Status: Approved**
2. Click **"Export CSV"** to download the payout report
3. Send the CSV to the finance team for bank transfers
4. After finance confirms payment:
   - Select the paid commissions
   - Click **"Mark Paid"**
   - Confirm in the dialog
   - Or update individually using the paid icon per row

### Voiding a Commission

1. Find the commission
2. Click the **Void** button (block icon) in the Actions column
3. A **confirmation dialog** warns "This action cannot be undone"
4. Click **"Void"** to confirm
5. The commission is marked as `voided` and excluded from payout reports

### Commission Calculation

| Field | Formula |
|-------|---------|
| **Order Value (Net)** | Order Total − Tax − Shipping |
| **Commission Amount** | Net Order Value × Commission Rate (%) |
| **Commission Rate** | Set in EPOS Affiliate → Settings |

---

## 4. Deactivate & Reactivate Accounts

### Deactivating a Reseller

1. Go to **WP Admin → EPOS Affiliate → Resellers**
2. Click the **Deactivate** button (block icon) on the reseller's row
3. A **confirmation dialog** appears warning that the reseller will be logged out immediately
4. Click **"Deactivate"** to confirm

**What happens:**
- Reseller's status is set to `inactive` in the database
- If they are currently logged in, they are **immediately logged out** and redirected to `/my/login/`
- All REST API calls return `403 Forbidden`
- Their BDs are **not** automatically deactivated (deactivate individually if needed)

### Deactivating a BD

1. Go to **WP Admin → EPOS Affiliate → BD Agents**
2. Click the **Deactivate** button on the BD's row
3. A **confirmation dialog** shows the BD name and tracking code, warns their coupon will be disabled
4. Click **"Deactivate"** to confirm

**What happens:**
- BD's status is set to `inactive`
- If currently logged in, they are **immediately logged out**
- Their WooCommerce tracking coupon is disabled
- QR code scans will no longer attribute orders to this BD

### Reactivating an Account

1. On the Resellers or BD Agents list, inactive accounts show a **Reactivate** button (green checkmark)
2. Click it, confirm in the dialog
3. The account is set back to `active` and the user can log in again

---

## 5. QR Codes

Every Reseller and BD has a QR code. You can view any QR code from the admin dashboard.

### Viewing a QR Code

1. On the **Resellers** or **BD Agents** list, click the **QR icon** in the QR column
2. A popup dialog shows:
   - Name and tracking code
   - QR code image
   - Full QR URL
3. Actions available:
   - **Copy Link** — copy the QR URL to clipboard
   - **Download** — save as 600×600 PNG
   - **Share** — native share (on supported browsers)

### QR URL Format

```
https://www.epos.com/my/qr/[QR_TOKEN]
```

The QR token is a random 32-character hex string, unique per BD/Reseller.

---

## 6. Serial Numbers

Serial numbers can be assigned to orders for device tracking.

### Assigning Serial Numbers

1. Go to **WP Admin → EPOS Affiliate → Serial Numbers**
2. Click **"Assign S/N"**
3. Enter the order number and serial number
4. Click **"Assign"**

### From WooCommerce Order

1. Open any order in **WooCommerce → Orders**
2. Find the **EPOS Serial Numbers** metabox
3. Enter the serial number and click **"Assign"**

---

## 7. Settings

Go to **WP Admin → EPOS Affiliate → Settings** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| BlueTap Product ID | WooCommerce product added to cart on QR scan | `2174` |
| Sales Commission Rate | Percentage of net order value | `10%` |

---

## 8. Troubleshooting

### Commission Issues

| Issue | Where to check |
|-------|---------------|
| Commission not created | WooCommerce → Status → Logs → `epos-affiliate` |
| Order has no BD attribution | Check order meta for `_bd_coupon_code` and `_bd_user_id` |
| BD not found error | Verify the BD exists and is `active` in BD Agents list |
| Duplicate commission | Check `_epos_attribution_processed` meta on the order |

### Account Issues

| Issue | Solution |
|-------|----------|
| Reseller/BD can't log in | Check account status is `active` in admin list |
| Deactivated user still has access | They will be logged out on next page load automatically |
| Welcome email not received | Check spam folder. Verify email is correct in user list |
| User forgot password | They can use "Forgot Password" on the login page |

### Checking Order Attribution in WooCommerce

Each BD-attributed order has notes visible in **WooCommerce → Orders → [Order] → Order Notes**:

**On order creation:**
```
🔗 BD Attribution: This order was referred by John Smith
   (Tracking: BD-ACME-JS001). Reseller ID: 1. Source: QR Code.
```

**On order processing:**
```
✅ Sales Commission Created
━━━━━━━━━━━━━━━━━━━━
BD Agent: John Smith
Tracking Code: BD-ACME-JS001
Reseller ID: 1
Order Value (net): RM 188.00
Commission Rate: 10%
Commission Amount: RM 18.80
Commission Status: Pending
Period: 2026-03
```

---

## 9. Quick Reference

### Pilot Checklist — What You Need Before Going Live

**To create a Reseller, prepare:**
1. Company/organization name
2. Unique slug (lowercase, e.g., `acme`)
3. Manager's email address

**To create a BD Agent, prepare:**
1. BD's full name
2. BD's email address
3. Which reseller they belong to
4. Short BD code (uppercase, e.g., `JS001`)

**After creating accounts:**
- [ ] Verify welcome emails were received
- [ ] Have users log in at `/my/login/` and change their password
- [ ] Test QR code scan → checkout → order → commission flow
- [ ] Check commission appears in admin Commissions list as `pending`

### Admin URLs

| Page | URL |
|------|-----|
| Dashboard | `wp-admin/admin.php?page=epos-affiliate` |
| Resellers | `wp-admin/admin.php?page=epos-affiliate-resellers` |
| BD Agents | `wp-admin/admin.php?page=epos-affiliate-bds` |
| Commissions | `wp-admin/admin.php?page=epos-affiliate-commissions` |
| Serial Numbers | `wp-admin/admin.php?page=epos-affiliate-serial-numbers` |
| Settings | `wp-admin/admin.php?page=epos-affiliate-settings` |

### User Roles

| Role | Login URL | Dashboard URL |
|------|-----------|---------------|
| Admin | `/wp-login.php` | `/wp-admin/` |
| Reseller Manager | `/my/login/` | `/my/dashboard/reseller/` |
| BD Agent | `/my/login/` | `/my/dashboard/bd/` |
