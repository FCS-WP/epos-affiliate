# EPOS Affiliate — Test Cases

## Table of Contents

1. [Product Catalog](#1-product-catalog)
2. [Account Creation](#2-account-creation)
3. [Product Assignment](#3-product-assignment)
4. [Login & Authentication](#4-login--authentication)
5. [Forgot Password & Reset](#5-forgot-password--reset)
6. [Change Password (Profile)](#6-change-password-profile)
7. [Deactivate & Reactivate Accounts](#7-deactivate--reactivate-accounts)
8. [QR Code Flow — Single Product](#8-qr-code-flow--single-product)
9. [QR Code Flow — Multiple Products](#9-qr-code-flow--multiple-products)
10. [Order Attribution & Commission](#10-order-attribution--commission)
11. [Admin Commission Management](#11-admin-commission-management)
12. [Dashboard Access & Permissions](#12-dashboard-access--permissions)
13. [Profile Management](#13-profile-management)
14. [Serial Numbers](#14-serial-numbers)
15. [CSV Export](#15-csv-export)
16. [Reseller BD Management](#16-reseller-bd-management)

---

## 1. Product Catalog

### TC-1.1: Add Product to Catalog

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to WP Admin → EPOS Affiliate → Products | Products page loads |
| 2 | Click "Add Product" | Dialog opens |
| 3 | Fill: Label = `A01`, WC Product = `BlueTap`, Commission = `20` | Fields accept input |
| 4 | Click "Add Product" | Product appears in list with label, WC product name, price, commission |

### TC-1.2: Duplicate Label

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to add another product with label `A01` | Error: "A product with this label already exists." |

### TC-1.3: Edit Catalog Product

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Edit on `A01` | Dialog opens with current values |
| 2 | Change commission to `25`, click "Update" | Updated in list |

### TC-1.4: Delete Catalog Product

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Delete on a product | Product removed from list |

### TC-1.5: Add Multiple Products

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add `A01` (BlueTap, RM 20) and `Series 1` (Series 1, RM 35) | Both appear in catalog list |

---

## 2. Account Creation

### TC-2.1: Create Reseller

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Resellers, click "Add Reseller" | Dialog opens |
| 2 | Fill: Name = `Test Reseller`, Prefix = `EPOS`, Email = `reseller@test.com` | Code preview shows `EPOS-01` (or next number) |
| 3 | Click "Create" | Snackbar: "Reseller created. Now assign products below." Dialog stays open in edit mode |
| 4 | Check Resellers list | New reseller with code `EPOS-01`, Products column shows `None` warning |
| 5 | Check email | Branded welcome email with username, password, login link to `/my/login/` |

### TC-2.2: Reseller Code Auto-Numbering

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create another reseller with prefix `EPOS` | Code = `EPOS-02` (auto-incremented) |
| 2 | Create with prefix `QASHIER` | Code = `QASHIER-01` (new prefix series) |

### TC-2.3: Create BD Agent

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to BD Agents, click "Add BD" | Dialog opens |
| 2 | Fill: Name = `John`, Email = `john@test.com`, Reseller = `Test Reseller (EPOS-01)` | Tracking code preview shows `EPOS-01-001` |
| 3 | Click "Create BD" | BD appears with auto-generated tracking code |
| 4 | Check email | Branded welcome email with reseller name |

### TC-2.4: BD Code Auto-Numbering

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create another BD under same reseller | Tracking code = `EPOS-01-002` |

### TC-2.5: Duplicate Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create reseller/BD with existing email | Error: "Email already exists." |

---

## 3. Product Assignment

### TC-3.1: Assign Product to Reseller

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit a reseller | Assigned Products section visible |
| 2 | Click "Add Product" | Dialog with catalog dropdown |
| 3 | Select `A01 — BlueTap` | Commission auto-fills from catalog default (e.g., RM 20) |
| 4 | Click "Add Product" | Product appears in table: Label=A01, Product=BlueTap, Commission=RM 20.00 |
| 5 | Check Resellers list | Products column shows `A01` chip |
| 6 | Check QR column | QR icon now visible |

### TC-3.2: Assign Multiple Products

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add `Series 1` to same reseller | Both `A01` and `Series 1` in assignment table |
| 2 | Check Resellers list | Products column shows `A01` `Series 1` chips |

### TC-3.3: Duplicate Assignment Prevention

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to add `A01` again to same reseller | Error: "This product is already assigned." |
| 2 | Dropdown should not show already-assigned products | `A01` filtered out of dropdown |

### TC-3.4: Override Commission

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In assignment table, click commission amount for `A01` | Inline editable |
| 2 | Change from `20` to `25`, press Enter | Saved, shows RM 25.00 |

### TC-3.5: Remove Product Assignment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Delete icon on `Series 1` | Product removed from table |
| 2 | QR still shows (A01 still assigned) | QR icon visible |
| 3 | Remove `A01` too | QR icon disappears (no products) |

### TC-3.6: No Products = No QR

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller with 0 products | Reseller list: QR column shows `—`, Products shows warning |
| 2 | BD dashboard of that reseller's BD | QR card hidden |
| 3 | BD QR Code page | Warning: "No QR code available. Contact your admin to assign products." |

---

## 4. Login & Authentication

### TC-4.1: Reseller Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/my/login/` | Login page with EPOS branding |
| 2 | Enter credentials | Redirected to `/my/dashboard/reseller/` |

### TC-4.2: BD Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter BD credentials | Redirected to `/my/dashboard/bd/` |

### TC-4.3: Invalid Credentials

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wrong password | Error: "Invalid username/email or password." |

### TC-4.4: Dashboard Access Without Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `/my/dashboard/bd/` without login | Redirected to `/my/login/` |
| 2 | Open `/my/dashboard/reseller/` without login | Redirected to `/my/login/` |

### TC-4.5: Account Disabled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `/my/login/?account_disabled=1` | Warning: "Your account has been disabled." |

### TC-4.6: WP Admin Blocked

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller tries `/wp-admin/` | Redirected to dashboard |
| 2 | BD tries `/wp-admin/` | Redirected to dashboard |

---

## 5. Forgot Password & Reset

### TC-5.1: Happy Path

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Forgot Password?" | Forgot view shown |
| 2 | Enter username/email, click "Send Reset Code" | Switches to reset view |
| 3 | Check email | 6-digit code, branded email, 15-min expiry note |
| 4 | Enter code + new password (8+ chars) + confirm | Success: "Password has been reset" |
| 5 | Login with new password | Works |

### TC-5.2: Non-existent User

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter unknown email | Same success message (prevents enumeration) |

### TC-5.3: Wrong Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter wrong 6-digit code | Error: "Invalid reset code" |

### TC-5.4: Expired Code (15 min)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wait 15+ min, enter code | Error: "Reset code has expired" |

### TC-5.5: Brute Force (5 attempts)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wrong code 5 times | Error: "Too many failed attempts" |
| 2 | Correct code after lockout | Still rejected (invalidated) |
| 3 | Request new code | Works |

---

## 6. Change Password (Profile)

### TC-6.1: Happy Path

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Profile → Change Password | Section visible |
| 2 | Enter current + new (8+ chars) + confirm | Success alert |
| 3 | Still logged in | Session re-authenticated |
| 4 | Logout, login with new password | Works |

### TC-6.2: Wrong Current Password

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wrong current password | Error: "Current password is incorrect." |

### TC-6.3: Too Short / Mismatch / Same

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | New password < 8 chars | Error message |
| 2 | New ≠ confirm | Error message |
| 3 | New = current | Error message |

---

## 7. Deactivate & Reactivate Accounts

### TC-7.1: Deactivate Reseller

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Deactivate on reseller | Dialog: "logged out immediately" |
| 2 | Confirm | Status → `Inactive` |
| 3 | Reseller was logged in | Immediately logged out → `/my/login/?account_disabled=1` |
| 4 | API calls | Return `403` |

### TC-7.2: Deactivate BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Deactivate on BD | Dialog: tracking code shown |
| 2 | Confirm | BD deactivated |
| 3 | QR scan for this BD | Error: "Invalid or expired QR code" |

### TC-7.3: Reactivate

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click green Reactivate on inactive account | Dialog → confirm |
| 2 | Status → `Active` | Can login again |

### TC-7.4: Cancel Dialog

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Deactivate, then Cancel | No change |

---

## 8. QR Code Flow — Single Product

### TC-8.1: Scan → Direct Checkout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller has only 1 product assigned (e.g., A01) | — |
| 2 | Scan BD's QR code | Redirected to product page with add-to-cart |
| 3 | Verify cart | Product in cart, qty 1 |
| 4 | Verify checkout | Standard checkout, no BD info visible |
| 5 | Complete payment | Order attributed to BD |
| 6 | Check order meta | `_bd_coupon_code`, `_bd_user_id`, `_reseller_id`, `_epos_product_id` present |

### TC-8.2: Cookie Persistence

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan QR, close browser before checkout | — |
| 2 | Reopen browser, go to product page | BD attribution cookie still present (24-hour expiry) |

### TC-8.3: Rate Limiting

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan same QR 6 times in 1 hour | First 5 succeed, 6th rate-limited |

---

## 9. QR Code Flow — Multiple Products

### TC-9.1: Scan → Product Selection Page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller has 2+ products (A01, Series 1) | — |
| 2 | Scan BD's QR code | Redirected to `/my/select-product/` |
| 3 | Page loads | EPOS branded page with product cards |
| 4 | Each card shows | Product label, WC product name (subtitle), price, arrow |
| 5 | Click a product | Redirected to product page → checkout |
| 6 | Complete payment | Order attributed, commission based on selected product's assignment |

### TC-9.2: Product Selection — Cookie Required

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/my/select-product/` directly (no QR scan) | Redirected to home (no cookie) |

### TC-9.3: Product Selection — Loading State

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click a product card | Selected card shows spinner, others fade to 40% |
| 2 | User is redirected | To product page with BD params |

### TC-9.4: No Products Assigned

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | BD's reseller has 0 products | — |
| 2 | Scan QR | Error: "No products are currently available for this QR code." |

---

## 10. Order Attribution & Commission

### TC-10.1: Commission Created

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete QR-attributed order | Order status → `processing` |
| 2 | Check admin Commissions | New commission: correct BD, fixed amount from assignment, order # |

### TC-10.2: Fixed Commission Amount

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Product assignment has commission RM 20 | — |
| 2 | Order placed for RM 188 | Commission = RM 20.00 (fixed, not percentage) |

### TC-10.3: No Assignment = RM 0

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Order with product that has no assignment | Commission = RM 0.00 |

### TC-10.4: No Duplicate

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Order: `processing` → `on-hold` → `processing` | Only 1 commission |

### TC-10.5: Order Note

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check WC order notes | Shows BD name, tracking code, product, commission (fixed) |

---

## 11. Admin Commission Management

### TC-11.1: Filter by Reseller

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select reseller from dropdown | Only that reseller's commissions shown |
| 2 | BD dropdown auto-filters | Only selected reseller's BDs |

### TC-11.2: Filter by BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a BD | Only that BD's commissions shown |

### TC-11.3: Filter by Status

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Pending" | Only pending shown |

### TC-11.4: Approve / Paid / Void

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click action button | MUI confirmation dialog |
| 2 | Confirm | Status updated |
| 3 | Cancel | No change |

### TC-11.5: Bulk Actions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select multiple, click action | Dialog shows count |
| 2 | Confirm | All updated |

### TC-11.6: Export with Filters

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Apply reseller + status filters, click Export | CSV contains only filtered data |

---

## 12. Dashboard Access & Permissions

### TC-12.1: BD Cannot Access Reseller API

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as BD, call `GET /dashboard/reseller` | `403` |

### TC-12.2: Data Isolation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller A | Only sees own BDs/orders |
| 2 | BD A | Only sees own orders |

---

## 13. Profile Management

### TC-13.1: Update Info

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Change name, phone, bank details | Saved and persists on reload |

### TC-13.2: Upload Photo

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click camera icon, select image | Avatar updates |

### TC-13.3: Update Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Change to new email, save | Updated |
| 2 | Try duplicate email | Error |

---

## 14. Serial Numbers

### TC-14.1: Assign SN

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin → Serial Numbers → Assign | SN saved |
| 2 | WC Order metabox → Assign | SN saved |

### TC-14.2: Duplicate SN

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Same SN to another order | Error |

---

## 15. CSV Export

### TC-15.1: Export Commissions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin Commissions → Export CSV | File downloads with filtered data |

### TC-15.2: Export BD Orders

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller/BD → Orders → Export | CSV with order data |

---

## 16. Reseller BD Management

### TC-16.1: Add BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller → Manage BDs → Add BD | Name + email only (code auto-generated) |
| 2 | Submit | BD created, email sent |

### TC-16.2: Edit / Deactivate / Reactivate / QR

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit | Name updated |
| 2 | Deactivate | MUI dialog → confirmed → BD inactive |
| 3 | Reactivate | MUI dialog → confirmed → BD active |
| 4 | View QR | QR popup with copy/download |

### TC-16.3: Data Isolation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller A's BD list | Only own BDs shown |

---

## Quick Smoke Test Checklist (Pilot)

**Setup:**
- [ ] Add products to catalog: A01 (BlueTap, RM 20), Series 1 (RM 35)
- [ ] Create reseller (prefix EPOS) → welcome email received
- [ ] Assign products (A01 + Series 1) to reseller → labels show in list
- [ ] Create BD under reseller → welcome email received, code auto-generated

**Login & Password:**
- [ ] Reseller login works → dashboard loads
- [ ] BD login works → dashboard loads
- [ ] Forgot password → code email → reset → login with new password
- [ ] Change password from Profile → still logged in → re-login works

**QR Flow (Single Product):**
- [ ] Remove Series 1, keep only A01 → single product
- [ ] BD QR scan → direct checkout → order → commission = RM 20 (fixed)

**QR Flow (Multiple Products):**
- [ ] Re-assign Series 1 → two products
- [ ] BD QR scan → product selection page → pick A01 → checkout → commission correct

**Admin:**
- [ ] Commission filter by reseller/BD/status works
- [ ] Approve → Mark Paid → Export CSV includes filters
- [ ] Deactivate BD → logged out, QR fails
- [ ] Reactivate BD → can login, QR works

**Access Control:**
- [ ] Non-logged-in → `/my/dashboard/bd/` → redirected to `/my/login/`
- [ ] BD cannot call reseller API → `403`
- [ ] Disabled account → logged out with warning
