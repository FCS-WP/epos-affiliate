# EPOS Affiliate — Admin Guide

## Table of Contents

1. [Create a Reseller](#1-create-a-reseller)
2. [Create a BD Agent](#2-create-a-bd-agent)
3. [Manage Commissions](#3-manage-commissions)

---

## 1. Create a Reseller

A Reseller is a partner organization whose BD agents sell EPOS products. Each reseller gets a WordPress user account with the `reseller_manager` role and a login to the Reseller Dashboard.

### Steps

1. Go to **WP Admin → EPOS Affiliate → Resellers**
2. Click **"Add Reseller"**
3. Fill in the form:

| Field | Description | Example |
|-------|-------------|---------|
| **Reseller Name** | Company or organization name | `Acme Resellers Sdn Bhd` |
| **Slug** | Unique identifier (lowercase, hyphens only). Used in tracking codes and UTM params | `acme` |
| **Manager Email** | Email for the reseller manager's WordPress account. They will receive a password reset email | `manager@acme.com` |

4. Click **"Create"**

### What happens automatically

- A **WordPress user** is created with role `reseller_manager`
- A **password reset email** is sent to the manager's email
- A record is added to the `epos_resellers` database table
- The reseller can now log in at `/my/login/` and access the **Reseller Dashboard** at `/my/dashboard/reseller/`

### After creation

- The reseller manager can view their own BD agents' performance, orders, and commissions
- They **cannot** create BDs or see other resellers' data
- To deactivate a reseller, click the **"Deactivate"** button on the Resellers list — this sets their status to `inactive`

---

## 2. Create a BD Agent

A BD (Business Development) agent is a field salesperson linked to a reseller. Each BD gets a unique QR code and tracking code for attributing sales.

### Prerequisites

- At least one **active reseller** must exist (see Step 1)

### Steps

1. Go to **WP Admin → EPOS Affiliate → BD Agents**
2. Click **"Add BD"**
3. Fill in the form:

| Field | Description | Example |
|-------|-------------|---------|
| **BD Name** | Full name of the sales agent | `John Smith` |
| **BD Email** | Email for the BD's WordPress account | `john@acme.com` |
| **Reseller** | Select which reseller this BD belongs to | `Acme Resellers Sdn Bhd` |
| **BD Code** | Short unique code (uppercase, no spaces). Combined with reseller slug to form the tracking code | `JS001` |

4. Click **"Create"**

### What happens automatically

- A **WordPress user** is created with role `bd_agent`
- A **password reset email** is sent to the BD's email
- A **tracking code** is generated: `BD-[RESELLER_SLUG]-[BD_CODE]` (e.g., `BD-ACME-JS001`)
- A **QR token** (random 32-character hex) is generated for the QR URL
- A **WooCommerce coupon** is created for record-keeping (RM0 tracking coupon, not applied to orders)
- The QR URL is: `https://www.epos.com/my/qr/[QR_TOKEN]`

### After creation

- The BD can log in at `/my/login/` and access:
  - **Dashboard** — KPIs and recent orders
  - **Orders** — full order history
  - **QR Code** — view, copy link, download PNG, share
  - **Profile** — edit personal info
- Share the QR code with the BD (they can also download it from their dashboard)
- To deactivate a BD, click **"Deactivate"** on the BD Agents list

### QR Code Flow

When a customer scans the BD's QR code:

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

Commissions are automatically created when a BD-attributed order reaches `processing` status (payment received). The admin must manually review, approve, and mark as paid.

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
2. Click the **"Approve"** button (checkmark icon) in the Actions column
3. The status changes from `pending` → `approved`

### Bulk Approve

1. Select multiple commissions using the checkboxes
2. Click the **"Approve Selected"** button at the top
3. All selected commissions change to `approved`

### Processing Payout

1. Filter commissions by **Status: Approved**
2. Click **"Export CSV"** to download the payout report
3. Send the CSV to the finance team for bank transfers
4. After finance confirms payment:
   - Select the paid commissions
   - Click **"Mark as Paid"**
   - Or update individually using the **"Paid"** button per row

### Voiding a Commission

1. Find the commission
2. Click the **"Void"** button (X icon) in the Actions column
3. The commission is marked as `voided` and excluded from payout reports

### Commission Calculation

| Field | Formula |
|-------|---------|
| **Order Value (Net)** | Order Total − Tax − Shipping |
| **Commission Amount** | Net Order Value × Commission Rate (%) |
| **Commission Rate** | Set in EPOS Affiliate → Settings |

### Checking Commission Details in WooCommerce

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

### Troubleshooting

| Issue | Where to check |
|-------|---------------|
| Commission not created | WooCommerce → Status → Logs → `epos-affiliate` |
| Order has no BD attribution | Check order meta for `_bd_coupon_code` and `_bd_user_id` |
| BD not found error | Verify the BD exists and is `active` in BD Agents list |
| Duplicate commission | Check `_epos_attribution_processed` meta on the order |

---

## Quick Reference

### Admin URLs

| Page | URL |
|------|-----|
| Dashboard | `wp-admin/admin.php?page=epos-affiliate` |
| Resellers | `wp-admin/admin.php?page=epos-affiliate-resellers` |
| BD Agents | `wp-admin/admin.php?page=epos-affiliate-bds` |
| Commissions | `wp-admin/admin.php?page=epos-affiliate-commissions` |
| Settings | `wp-admin/admin.php?page=epos-affiliate-settings` |

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| BlueTap Product ID | WooCommerce product added to cart on QR scan | `2174` |
| Sales Commission Rate | Percentage of net order value | `10%` |

### User Roles

| Role | Login URL | Dashboard URL |
|------|-----------|---------------|
| Admin | `/wp-login.php` | `/wp-admin/` |
| Reseller Manager | `/my/login/` | `/my/dashboard/reseller/` |
| BD Agent | `/my/login/` | `/my/dashboard/bd/` |
