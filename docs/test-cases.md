# EPOS Affiliate — Test Cases

## Table of Contents

1. [Account Creation](#1-account-creation)
2. [Login & Authentication](#2-login--authentication)
3. [Forgot Password & Reset](#3-forgot-password--reset)
4. [Change Password (Profile)](#4-change-password-profile)
5. [Deactivate & Reactivate Accounts](#5-deactivate--reactivate-accounts)
6. [QR Code Flow](#6-qr-code-flow)
7. [Order Attribution & Commission](#7-order-attribution--commission)
8. [Admin Commission Management](#8-admin-commission-management)
9. [Dashboard Access & Permissions](#9-dashboard-access--permissions)
10. [Profile Management](#10-profile-management)
11. [Serial Numbers](#11-serial-numbers)
12. [CSV Export](#12-csv-export)
13. [Reseller BD Management](#13-reseller-bd-management)

---

## 1. Account Creation

### TC-1.1: Create Reseller (Admin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to WP Admin → EPOS Affiliate → Resellers | Reseller list page loads |
| 2 | Click "Add Reseller" | Create dialog opens |
| 3 | Fill: Name = `Test Reseller`, Slug = `test-reseller`, Email = `reseller@test.com` | Fields accept input |
| 4 | Click "Create" | Dialog closes, success snackbar |
| 5 | Check reseller list | New reseller with status `Active`, QR icon clickable |
| 6 | Check email inbox for `reseller@test.com` | Branded welcome email with username, password, login link `/my/login/` |

### TC-1.2: Create Reseller — Duplicate Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create reseller with existing email | Error: "Email already exists." |

### TC-1.3: Create Reseller — Duplicate Slug

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create reseller with existing slug | Error message shown |

### TC-1.4: Create BD Agent (Admin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to WP Admin → EPOS Affiliate → BD Agents | BD list loads |
| 2 | Click "Add BD" | Create dialog opens |
| 3 | Fill: Name = `Test BD`, Email = `bd@test.com`, Reseller = `Test Reseller`, BD Code = `TB001` | Tracking code preview: `BD-TEST-RESELLER-TB001` |
| 4 | Click "Create BD" | Dialog closes, success snackbar |
| 5 | Check BD list | New BD with status `Active`, tracking code, QR icon |
| 6 | Check email inbox | Branded welcome email with username, password, reseller name, login link |

### TC-1.5: Create BD — Duplicate Tracking Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create BD with same reseller + BD code | Error: "Tracking code already exists." |

### TC-1.6: Create BD — Duplicate Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create BD with existing email | Error: "Email already exists." |

---

## 2. Login & Authentication

### TC-2.1: Reseller Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/my/login/` | Login page loads with EPOS branding |
| 2 | Enter reseller credentials from welcome email | Fields accept input |
| 3 | Click "Sign In to Portal" | Loading spinner shown |
| 4 | Wait for redirect | Redirected to `/my/dashboard/reseller/` |
| 5 | Verify dashboard | KPI cards, QR card, BD performance visible |

### TC-2.2: BD Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/my/login/` | Login page loads |
| 2 | Enter BD credentials | Fields accept input |
| 3 | Click "Sign In to Portal" | Redirected to `/my/dashboard/bd/` |
| 4 | Verify dashboard | QR card, Total Orders, recent orders visible |

### TC-2.3: Invalid Credentials

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter wrong password | Error: "Invalid username/email or password." |

### TC-2.4: Non-affiliate User Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with regular WP user (subscriber/editor) | Error: "Your account does not have access to this portal." |

### TC-2.5: Access Dashboard Without Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `/my/dashboard/bd/` without login | Redirected to `/my/login/` |
| 2 | Open `/my/dashboard/reseller/` without login | Redirected to `/my/login/` |

### TC-2.6: Account Disabled Message

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `/my/login/?account_disabled=1` | Warning: "Your account has been disabled. Please contact your administrator." |

### TC-2.7: WP Admin Blocked for Reseller/BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Reseller, access `/wp-admin/` | Redirected to `/my/dashboard/reseller/` |
| 2 | Login as BD, access `/wp-admin/` | Redirected to `/my/dashboard/bd/` |

### TC-2.8: Remember Me

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with "Remember Me" checked | Login successful |
| 2 | Close browser, reopen dashboard URL | Still logged in |

---

## 3. Forgot Password & Reset

### TC-3.1: Forgot Password — Happy Path

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On login page, click "Forgot Password?" | Forgot password view shown |
| 2 | Enter username or email | Field accepts input |
| 3 | Click "Send Reset Code" | View switches to "Reset Password" with code input |
| 4 | Check email | Branded email with large 6-digit code, 15-min expiry note |
| 5 | Enter the 6-digit code | Input: digits only, max 6 chars, monospace styling |
| 6 | Enter new password (8+ chars) + confirm | Fields accept input |
| 7 | Click "Reset Password" | Success: "Password has been reset successfully" |
| 8 | Click "Back to Login" | Login view shown |
| 9 | Login with new password | Login successful |

### TC-3.2: Forgot Password — Non-existent User

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter username/email that doesn't exist | Same generic success message (prevents user enumeration) |
| 2 | Check inbox | No email received |

### TC-3.3: Reset — Wrong Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter incorrect 6-digit code | Error: "Invalid reset code or the code has expired." |

### TC-3.4: Reset — Expired Code (15 min)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wait 15+ minutes after requesting code | — |
| 2 | Enter the expired code | Error: "Reset code has expired. Please request a new one." |

### TC-3.5: Reset — Brute Force Protection (5 attempts)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter wrong code 5 times | Error: "Too many failed attempts. Please request a new reset code." |
| 2 | Try correct code after lockout | Still rejected (code invalidated) |
| 3 | Request new code | New code works |

### TC-3.6: Reset — Password Too Short

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter password < 8 characters | Error: "Password must be at least 8 characters long." |

### TC-3.7: Reset — Passwords Don't Match

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter different new + confirm passwords | Error: "Passwords do not match." |

### TC-3.8: Resend Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Didn't receive the code? Send again" | Goes back to forgot view |
| 2 | Submit again | New code sent, old code invalidated |

---

## 4. Change Password (Profile)

### TC-4.1: Change Password — Happy Path

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Reseller or BD | Dashboard loads |
| 2 | Go to Profile | Form loads with "Change Password" section at bottom |
| 3 | Enter current password | Field accepts input |
| 4 | Enter new password (8+ chars) | Helper: "Minimum 8 characters" |
| 5 | Enter matching confirm password | Field accepts input |
| 6 | Click "Change Password" | Success: "Password changed successfully." |
| 7 | Verify still logged in | Dashboard still accessible (session re-authenticated) |
| 8 | Logout, login with new password | Login successful |

### TC-4.2: Wrong Current Password

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter incorrect current password | Error: "Current password is incorrect." |

### TC-4.3: Password Too Short

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter new password < 8 chars | Error: "New password must be at least 8 characters long." |

### TC-4.4: Passwords Don't Match

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter different new + confirm | Error: "New password and confirmation do not match." |

### TC-4.5: Same as Current

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter current password as new | Error: "New password must be different from the current password." |

### TC-4.6: Show/Hide Toggle

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click eye icon on each field | Toggles between dots and visible text |

---

## 5. Deactivate & Reactivate Accounts

### TC-5.1: Deactivate Reseller (Admin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin Resellers list, click Deactivate icon | Dialog: warning icon, reseller name, "logged out immediately" |
| 2 | Click "Deactivate" | Status → `Inactive`, snackbar shown |
| 3 | Reseller was logged in | Immediately logged out → `/my/login/?account_disabled=1` |
| 4 | Reseller tries to login | Logged out again with disabled message |
| 5 | API calls with reseller session | Returns `403 Forbidden` |

### TC-5.2: Deactivate BD (Admin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Deactivate on active BD | Dialog: BD name + tracking code, "coupon will be disabled" |
| 2 | Click "Deactivate" | BD deactivated, coupon disabled |
| 3 | BD tries to access dashboard | Logged out → `/my/login/` |
| 4 | Scan BD's QR code | Should NOT attribute orders |

### TC-5.3: Reactivate Reseller

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click green checkmark on inactive reseller | Dialog: "will regain access" |
| 2 | Click "Reactivate" | Status → `Active` |
| 3 | Reseller logs in | Dashboard loads successfully |

### TC-5.4: Reactivate BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click green checkmark on inactive BD | Confirmation dialog |
| 2 | Click "Reactivate" | Status → `Active` |
| 3 | BD logs in | Dashboard accessible, QR works again |

### TC-5.5: Cancel Confirmation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Deactivate on any account | Dialog appears |
| 2 | Click "Cancel" | Dialog closes, no status change |

---

## 6. QR Code Flow

### TC-6.1: BD QR Scan → Checkout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan BD's QR code or open URL | Redirected to `/my/bluetap/` |
| 2 | Verify cart | BlueTap product (ID 2174), qty 1 |
| 3 | Verify checkout page | Standard checkout, NO coupon, NO BD info visible |
| 4 | Complete payment | Order `processing` |
| 5 | Check order meta in WP Admin | `_bd_coupon_code`, `_bd_user_id`, `_reseller_id` present |
| 6 | Check order notes | Attribution note visible |

### TC-6.2: Reseller QR Scan → Checkout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan reseller's QR code | Same flow, tracking code = `BD-[SLUG]-OWNER` |
| 2 | Complete checkout | Order attributed to reseller's BD record |

### TC-6.3: QR Rate Limiting

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan same QR 6 times in 1 hour from same IP | First 5 succeed, 6th rate-limited |

### TC-6.4: QR for Inactive BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Deactivate BD, scan their QR | Should not redirect to checkout / show error |

### TC-6.5: Admin QR Popup — Reseller

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin Resellers list, click QR icon | Popup: name, tracking code, QR image, URL |
| 2 | Click "Copy Link" | URL copied, snackbar |
| 3 | Click "Download" | PNG file downloaded (600x600) |
| 4 | Click "Close" | Dialog closes |

### TC-6.6: Admin QR Popup — BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin BD list, click QR icon | Popup: BD name, tracking code, QR image, URL |
| 2 | Test Copy + Download | Both work |

---

## 7. Order Attribution & Commission

### TC-7.1: Commission Auto-Created

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete QR-attributed order | Order created |
| 2 | Order status → `processing` | Commission record created, status `pending` |
| 3 | Admin Commissions list | New commission: correct BD, amount, order #, period |

### TC-7.2: Commission Calculation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Settings: commission rate = 10% | Saved |
| 2 | Order net value = RM 188.00 | Commission = RM 18.80 |

### TC-7.3: No Duplicate Commission

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Order: `processing` → `on-hold` → `processing` | Only 1 commission (checked by `_epos_attribution_processed`) |

### TC-7.4: Normal Order — No Attribution

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place order without QR scan | No attribution, no commission |

---

## 8. Admin Commission Management

### TC-8.1: Approve Single

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Approve on `pending` commission | Dialog: blue icon, ID + amount + BD name |
| 2 | Click "Approve" | Status → `approved`, snackbar |

### TC-8.2: Mark Paid Single

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Paid on `approved` commission | Dialog: green icon |
| 2 | Click "Mark Paid" | Status → `paid` |

### TC-8.3: Void Single

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Void on `pending` or `approved` | Dialog: warning, "cannot be undone" |
| 2 | Click "Void" | Status → `voided` |

### TC-8.4: Bulk Approve

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select multiple `pending`, click "Approve" | Dialog: "approve X commission(s)?" |
| 2 | Confirm | All → `approved` |

### TC-8.5: Bulk Mark Paid

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select `approved`, click "Mark Paid", confirm | All → `paid` |

### TC-8.6: Bulk Void

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select multiple, click "Void" | Dialog warns "cannot be undone" |
| 2 | Confirm | All → `voided` |

### TC-8.7: Cancel Dialog

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click any action | Dialog appears |
| 2 | Click "Cancel" | Dialog closes, no change |

### TC-8.8: Filter Commissions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Filter Status = `Pending` | Only pending shown |
| 2 | Filter Type = `Sales` | Only sales shown |
| 3 | Clear filters | All shown |

---

## 9. Dashboard Access & Permissions

### TC-9.1: BD Cannot Access Reseller API

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as BD, call `GET /dashboard/reseller` | `403 Forbidden` |

### TC-9.2: Reseller Data Isolation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Reseller A | Dashboard loads |
| 2 | API returns only Reseller A's BDs and orders | No data from Reseller B |

### TC-9.3: BD Data Isolation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as BD A | Dashboard loads |
| 2 | API returns only BD A's orders | No data from BD B |

### TC-9.4: Admin Full Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Admin | All resellers, BDs, commissions accessible |

---

## 10. Profile Management

### TC-10.1: Update Personal Info

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Profile | Form loads with current data |
| 2 | Change name and phone, click "Save Profile" | Success snackbar |
| 3 | Reload page | Updated values persist |

### TC-10.2: Update Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Change to new valid email, save | Email updated |
| 2 | Try duplicate email | Error: "This email is already in use." |

### TC-10.3: Update Bank Details

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill bank name, account number, holder name | Fields accept input |
| 2 | Save and reload | Values persist |

### TC-10.4: Upload Profile Photo

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click camera icon, select image | Avatar updates |
| 2 | Reload page | Photo persists |

---

## 11. Serial Numbers

### TC-11.1: Assign SN (Admin Page)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin → Serial Numbers, click "Assign S/N" | Dialog opens |
| 2 | Enter order number + serial number | Fields accept input |
| 3 | Click "Assign" | SN appears in list |

### TC-11.2: Assign SN (WC Order Metabox)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open order in WooCommerce | EPOS Serial Numbers metabox visible |
| 2 | Enter SN, click "Assign" | SN saved and displayed |

### TC-11.3: Duplicate SN

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Assign same SN to another order | Error: uniqueness violation |

### TC-11.4: Delete SN

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete on assigned SN | SN removed |

---

## 12. CSV Export

### TC-12.1: Export Commissions (Admin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin Commissions, apply filters, click "Export CSV" | CSV downloads |
| 2 | Open CSV | Correct headers, data, formatting, multiple rows |

### TC-12.2: Export BD Orders (Reseller)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller → BD's orders, click "Export CSV" | CSV with order data, "Number of Units" column |

### TC-12.3: Export BD Orders (BD)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | BD → Orders, click "Export CSV" | CSV with own orders only |

### TC-12.4: Export Reseller Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller dashboard, click "Export CSV" | CSV with BD performance data |

---

## 13. Reseller BD Management

### TC-13.1: Reseller Adds BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Reseller → Manage BDs, click "Add BD" | Dialog: name, email, BD code fields |
| 2 | Fill and submit | BD created, snackbar: "Login credentials sent via email." |
| 3 | Check BD email | Welcome email received |

### TC-13.2: Reseller Edits BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Edit on BD | Edit dialog |
| 2 | Change name, save | Name updated |

### TC-13.3: Reseller Deactivates BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Deactivate on active BD | MUI confirmation dialog |
| 2 | Click "Deactivate" | BD deactivated |

### TC-13.4: Reseller Reactivates BD

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Reactivate on inactive BD | MUI confirmation dialog |
| 2 | Click "Reactivate" | BD reactivated |

### TC-13.5: Reseller Views BD QR Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click QR icon on any BD | QR popup: name, tracking code, QR image, copy/download/share |

### TC-13.6: Reseller Cannot See Other Reseller's BDs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | API scoped to own reseller_id | Only own BDs returned |

---

## Quick Smoke Test Checklist (Pilot)

- [ ] Create reseller → welcome email received → login works
- [ ] Create BD under reseller → welcome email received → login works
- [ ] BD changes password from Profile → logout → re-login with new password
- [ ] BD QR scan → cart → checkout → order → commission shows as `pending`
- [ ] Reseller QR scan → same flow works
- [ ] Admin approves commission → status `approved`
- [ ] Admin marks commission paid → status `paid`
- [ ] Admin voids commission → status `voided`, confirmation warns "cannot be undone"
- [ ] Admin deactivates BD → BD immediately logged out, cannot re-login
- [ ] Admin reactivates BD → BD can login again
- [ ] Admin deactivates reseller → reseller logged out, cannot re-login
- [ ] Admin reactivates reseller → reseller can login again
- [ ] Forgot password → code email received → enter code → reset works → login with new password
- [ ] Forgot password → wrong code 5x → locked out → request new code
- [ ] Non-logged-in user visits `/my/dashboard/bd/` → redirected to `/my/login/`
- [ ] Non-logged-in user visits `/my/dashboard/reseller/` → redirected to `/my/login/`
- [ ] BD cannot call reseller dashboard API → `403`
- [ ] Reseller A cannot see Reseller B's data
- [ ] CSV export works for commissions, BD orders, reseller performance
- [ ] Reseller can add/edit/deactivate/reactivate their own BDs
- [ ] Admin QR popup works for both Resellers and BDs (copy, download)
- [ ] Serial number assign from admin + WC order metabox
- [ ] Profile photo upload works for BD and Reseller
