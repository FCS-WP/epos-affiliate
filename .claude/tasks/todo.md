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
- [ ] Test inactive account blocking — deactivated reseller/BD should get logged out and redirected
- [ ] Test serial number assignment — uniqueness, order status validation, over-assign prevention

### Admin Dashboard Enhancement
- [ ] Enhance admin Reseller list UI (DataGrid, search, filters)
- [ ] Enhance admin BD list UI (DataGrid, search, filters)
- [ ] Enhance admin Commission list UI (DataGrid, bulk actions, filters)
- [ ] Enhance admin Settings UI
- [ ] Admin dashboard chart — wire up to real data (currently uses mock data)

### Minor Fixes
- [ ] Custom password reset page (match login page style instead of WP default)
- [ ] Commission auto-calculation — verify rate is applied correctly from settings
- [ ] Show "account disabled" message on login page when `?account_disabled=1` param is present

## Phase 2 — April 8 Target

### Usage Bonus Commission
- [ ] Monthly calculation based on 3-day device activity threshold
- [ ] Wire up serial numbers to usage tracking (SN → device activity → bonus)
- [ ] System checks device activity against 3-day threshold at month-end
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
- [ ] BD deactivation — freeze dashboard, retain read-only 30 days
- [ ] Reseller deactivation — show "account disabled" page instead of login redirect
