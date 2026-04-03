# EPOS Affiliate — Reseller Guide

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Your Dashboard](#2-your-dashboard)
3. [Your QR Code](#3-your-qr-code)
4. [Managing Your BDs](#4-managing-your-bds)
5. [Viewing BD Performance](#5-viewing-bd-performance)
6. [Your Profile](#6-your-profile)
7. [FAQ](#7-faq)

---

## 1. Getting Started

### First Login

You will receive a **welcome email** when your account is created. The email contains:
- Your **username**
- Your **temporary password**
- A link to the **login page**

**Steps:**
1. Open the login link from your email: `/my/login/`
2. Enter your username and password
3. You will be redirected to your **Reseller Dashboard**

> **Important:** Change your password after your first login. Go to **Profile → Change Password**.

### Login URL

```
https://www.epos.com/my/login/
```

After logging in, you are automatically redirected to your dashboard at `/my/dashboard/reseller/`.

---

## 2. Your Dashboard

Your dashboard shows an overview of your team's sales performance.

### KPI Cards

| Card | Description |
|------|-------------|
| **Total Orders** | Number of orders attributed to your team |
| **Total Revenue** | Total revenue from your team's attributed orders |
| **Active BDs** | Number of currently active BD agents under you |

### QR Tracking Card

Your own QR code is displayed on the dashboard. You can use this QR code to personally refer customers, just like your BDs.

### BD Performance Table

Shows a ranked list of your BD agents with:
- Number of orders
- Revenue generated
- "View Orders" button to drill down into each BD's order history

### Filters

- **Date range** — filter KPIs and tables by date period
- **Search** — search BDs by name
- **Export CSV** — download performance data

---

## 3. Your QR Code

As a Reseller, you have your own QR code for personal referrals.

### How it works

1. A customer scans your QR code
2. They are taken to the EPOS product page with the product pre-added to cart
3. The customer completes checkout normally
4. The order is attributed to you and a commission is recorded

### Viewing your QR Code

- On your **Dashboard**, your QR code is displayed in the QR Tracking Card
- Go to **QR Code** page from the sidebar for the full view

### Actions

| Action | Description |
|--------|-------------|
| **Copy Link** | Copy your QR URL to clipboard — useful for sharing via messaging apps |
| **Download PNG** | Save the QR code as an image file (600×600 pixels) |
| **Share** | Use your device's native share feature (mobile) |

### Your QR URL Format

```
https://www.epos.com/my/qr/[YOUR_TOKEN]
```

> **Tip:** You can share the URL directly — the customer doesn't need to scan the QR image. The link works the same way.

---

## 4. Managing Your BDs

You can add, edit, deactivate, and reactivate BD agents from your dashboard.

### Navigate

Go to **Manage BDs** from the sidebar menu.

### Adding a New BD

**Information needed:**

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **BD Name** | Full name of the sales agent | Yes | `John Smith` |
| **BD Email** | Email for the BD's login account | Yes | `john@example.com` |
| **BD Code** | Short unique code (uppercase, no spaces) | Yes | `JS001` |

**Steps:**
1. Click **"Add BD"**
2. Fill in the name, email, and BD code
3. Click **"Create BD"**

**What happens:**
- A login account is created for the BD
- A **welcome email** is sent with their login credentials
- A unique QR code and tracking code are generated
- The tracking code format is: `BD-[YOUR_SLUG]-[BD_CODE]`

### Editing a BD

1. Click the **Edit** icon on the BD's row
2. Update the BD name
3. Click **"Update"**

> **Note:** Email, BD code, and tracking code cannot be changed after creation.

### Viewing a BD's QR Code

1. Click the **QR** icon on the BD's row
2. A popup shows the QR code with copy, download, and share options

### Deactivating a BD

1. Click the **Deactivate** icon (block icon) on the BD's row
2. A confirmation dialog appears
3. Click **"Deactivate"** to confirm

> **What happens:** The BD is immediately logged out, their QR code stops working, and they cannot access their dashboard.

### Reactivating a BD

1. Inactive BDs show a **Reactivate** icon (green checkmark)
2. Click it and confirm in the dialog
3. The BD can log in and use their QR code again

---

## 5. Viewing BD Performance

### BD Performance Rankings

From your dashboard, the BD Performance table shows all your BDs ranked by performance:
- Orders count
- Revenue generated
- Progress bar showing relative performance

### Drill-Down: BD Orders

1. Click **"View Orders"** on any BD's row
2. See the full list of orders attributed to that BD:
   - Order number
   - Order date
   - Order value
   - Number of units
3. Use **search** to find specific orders
4. Use **date filter** to narrow by time period
5. Click **"Export CSV"** to download the data

---

## 6. Your Profile

Go to **Profile** from the sidebar menu to manage your account.

### Personal Information

| Field | Description |
|-------|-------------|
| **Name** | Your display name |
| **Email** | Your login email |
| **Phone** | Contact number |

### Address

| Field | Description |
|-------|-------------|
| **Address Line 1** | Street address |
| **Address Line 2** | Additional address info |
| **City** | City |
| **State** | State |
| **Postcode** | Postal code |

### Bank Details (for Payout)

| Field | Description |
|-------|-------------|
| **Bank Name** | Your bank's name |
| **Account Number** | Bank account number |
| **Account Holder Name** | Name on the bank account |

> **Important:** Ensure your bank details are correct. Commissions are paid directly to this account.

### Profile Photo

Click the camera icon on your avatar to upload a profile photo.

### Change Password

1. Scroll down to the **Change Password** section
2. Enter your **current password**
3. Enter your **new password** (minimum 8 characters)
4. Enter the new password again to **confirm**
5. Click **"Change Password"**

> **Security:** Your new password must be at least 8 characters and different from your current password.

---

## 7. FAQ

**Q: I forgot my password. How do I reset it?**
A: On the login page at `/my/login/`, click "Forgot Password?" to reset via email.

**Q: Can my BDs see my dashboard?**
A: No. Each BD can only see their own data. They cannot see other BDs' data or your reseller dashboard.

**Q: Can I see which orders came from my personal QR code vs my BDs?**
A: Yes. Your personal orders use tracking code `BD-[SLUG]-OWNER`. You can filter by this in the orders view.

**Q: What happens when I deactivate a BD?**
A: They are immediately logged out, their QR code stops attributing orders, and they cannot access their dashboard. You can reactivate them at any time.

**Q: How are commissions paid?**
A: Commissions are reviewed and approved by the admin team, then paid to the bank account in your profile. Make sure your bank details are up to date.

**Q: I can't log in and see a message about my account being disabled.**
A: Contact your admin. Your account may have been deactivated.
