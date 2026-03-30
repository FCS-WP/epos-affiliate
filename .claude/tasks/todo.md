# Todo

## Phase 1 — Remaining (Polish & Testing)

### Testing & QA
- [ ] End-to-end QR flow test on live WooCommerce (scan → cart → checkout → order → attribution → commission)
- [ ] Verify BD attribution meta written to order (invisible to customer)
- [ ] Verify no coupon visible on checkout page
- [ ] Test REST API endpoints with correct and incorrect roles (401/403)
- [ ] Test role-based access: BD cannot hit reseller dashboard API
- [ ] Test login redirect: BD → `/my/dashboard/bd/`, Reseller → `/my/dashboard/reseller/`
- [ ] Test wp-admin blocking for BD/Reseller roles
- [ ] Test profile photo upload for BD and Reseller
- [ ] Test with existing sitewide promos active (e.g., RM188 pre-order price)
- [ ] Test Reseller QR flow (same as BD flow, tracking code `BD-[SLUG]-OWNER`)
- [ ] Verify CSV exports contain correct data with proper formatting

### Admin Dashboard Enhancement
- [ ] Enhance admin Reseller list UI (DataGrid, search, filters)
- [ ] Enhance admin BD list UI (DataGrid, search, filters)
- [ ] Enhance admin Commission list UI (DataGrid, bulk actions, filters)
- [ ] Enhance admin Settings UI
- [ ] Admin dashboard chart — wire up to real data (currently uses mock data)

### Minor Fixes
- [ ] Custom password reset page (match login page style instead of WP default)
- [ ] Commission auto-calculation — verify rate is applied correctly from settings

## Phase 2 — April 8 Target

### Usage Bonus Commission
- [ ] Monthly calculation based on 3-day device activity threshold
- [ ] CSV upload endpoint (order → S/N mapping) — ops uploads CSV
- [ ] System matches orders to serial numbers
- [ ] Evaluate devices against activity threshold at month-end
- [ ] Generate bonus commission records for qualifying BDs
- [ ] "Has achieved usage target" column — wire up to real data (currently placeholder "No")
- [ ] Usage bonus history in BD dashboard
- [ ] Usage bonus history in Reseller dashboard

### Series 1 Product Support
- [ ] Expand product configuration beyond BlueTap (product ID 2174)
- [ ] Support multiple products in QR redirect flow
- [ ] Multi-product commission rates in settings

## Backlog (Nice-to-Have)

- [ ] Push notifications — alert BD when order is attributed
- [ ] Dashboard analytics charts — trend lines, bar charts for revenue over time
- [ ] Bulk BD onboarding — CSV import for creating multiple BDs
- [ ] Email templates — branded emails for BD/Reseller onboarding
- [ ] Reseller-initiated BD creation with approval workflow
- [ ] BD deactivation — freeze dashboard, retain read-only 30 days
