

# Extend Neobrutalism UI Across the App (Excluding Landing Page)

## Goal
Apply subtle neobrutalism accents and the updated saturated blue palette consistently across all dashboard pages, the auth page, and the sidebar -- without disrupting usability or navigation flow. The changes are cosmetic only; no functionality changes.

## Design Principles
- **Subtle, not aggressive**: Dashboard pages need to be professional and easy to scan. Neobrutalism touches will be lighter than the landing page -- thinner borders (2px), smaller shadows, no rotation effects.
- **Consistency**: Every page gets the same card style, button accents, and spacing rhythm.
- **No disruption**: All layouts, interactions, and data flows remain identical.

## Changes by File

### 1. Fix Missing DashboardLayout on 3 Pages
**Files:** `src/pages/Expenses.tsx`, `src/pages/RecurringInvoices.tsx`

These pages render without the sidebar navigation. Wrap their content in `<DashboardLayout>` so users can navigate normally. The RecurringInvoices page also uses `SubscriptionGuard` as an outer wrapper which blocks the layout -- move the guard inside the layout instead.

### 2. Sidebar Enhancement
**File:** `src/components/DashboardLayout.tsx`

- Add a subtle 2px left accent border on the active nav item (primary blue)
- Add a tiny colored dot indicator next to premium nav items instead of (or alongside) the crown icon
- Slightly increase font weight on section header "CushyInvoice"

### 3. Dashboard Page Cards
**File:** `src/pages/Dashboard.tsx`

- Apply `neo-card` class to stat cards for subtle border + offset shadow
- Add colored left-border accent to each stat card (green for paid, blue for outstanding, etc.)
- Style the "Recent Invoices" list items with a subtle left-border color based on status
- Style action buttons (Add Client, Create Invoice) with `neo-brutal-btn` class

### 4. Clients Page
**File:** `src/pages/Clients.tsx`

- Apply `neo-card` to the search card and table card
- Style the "Add Client" button with `neo-brutal-btn`
- Add subtle row hover with a left-border highlight on the table

### 5. Products Page
**File:** `src/pages/Products.tsx`

- Same treatment as Clients: `neo-card` on cards, `neo-brutal-btn` on primary button
- Consistent table styling

### 6. Invoices Page
**File:** `src/pages/Invoices.tsx`

- `neo-card` on cards
- `neo-brutal-btn` on "New Invoice" button
- Status badges get slightly bolder borders

### 7. Expenses Page
**File:** `src/pages/Expenses.tsx`

- Wrap in `DashboardLayout`
- Apply `neo-card` to stat cards and expense list card
- Style category breakdown items with colored left borders

### 8. Recurring Invoices Page
**File:** `src/pages/RecurringInvoices.tsx`

- Wrap in `DashboardLayout` (move `SubscriptionGuard` inside)
- Apply `neo-card` to recurring invoice cards
- Style action buttons consistently

### 9. Reports Page
**File:** `src/pages/Reports.tsx`

- `neo-card` on all cards
- `neo-brutal-btn` on Export button
- Colored stat values (green for paid, red for unpaid) with bolder weight

### 10. Settings Page
**File:** `src/pages/Settings.tsx`

- `neo-card` on setting section cards
- Style tab triggers with a bolder active state
- `neo-brutal-btn` on primary Save/Update buttons

### 11. Auth Page
**File:** `src/components/AuthLayout.tsx`

- Apply `neo-card` styling to the feature cards on the left panel
- Add subtle noise texture to the gradient background (reuse `.landing-noise`)
- Style the form card with a subtle neo-card border
- Style the primary "Sign In" / "Create Account" button with `neo-brutal-btn`

### 12. Update Neo-Card CSS for Dashboard Context
**File:** `src/index.css`

- Add a `.neo-card-subtle` variant with thinner border (1.5px) and smaller shadow offset (3px) -- better for data-heavy dashboard contexts vs. the landing page's bolder 2px/5px
- Add `.neo-stat-card` with a colored left border utility
- Add status-based left-border utilities (`.border-l-success`, `.border-l-info`, etc.)

## What Does NOT Change
- Landing page (Index.tsx) -- already done
- All data fetching, form logic, and routing
- Color palette (already updated in previous step)
- Core component files (button.tsx, card.tsx, etc.) -- styling applied via className overrides

## Summary Table

| File | Changes |
|------|---------|
| `src/index.css` | Add `.neo-card-subtle`, `.neo-stat-card`, status border utilities |
| `src/components/DashboardLayout.tsx` | Active nav accent, minor styling |
| `src/components/AuthLayout.tsx` | Neo-card features, noise texture, button styling |
| `src/pages/Dashboard.tsx` | Neo-card stats, status borders, neo-brutal buttons |
| `src/pages/Clients.tsx` | Neo-card, neo-brutal primary button |
| `src/pages/Products.tsx` | Neo-card, neo-brutal primary button |
| `src/pages/Invoices.tsx` | Neo-card, neo-brutal primary button |
| `src/pages/Expenses.tsx` | Add DashboardLayout, neo-card, status borders |
| `src/pages/RecurringInvoices.tsx` | Add DashboardLayout, move guard inside, neo-card |
| `src/pages/Reports.tsx` | Neo-card, neo-brutal export button |
| `src/pages/Settings.tsx` | Neo-card sections, neo-brutal save buttons |

