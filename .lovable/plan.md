

# Fix Overlapping UI and Blank Create Invoice Page

## Issues Identified

### 1. Blank "Create Invoice" Page
The page renders completely white. Two likely causes:
- The `App.css` file contains `#root { max-width: 1280px; padding: 2rem; text-align: center; }` -- this constrains the root container and adds padding that can interfere with the full-width dashboard layout. This is leftover boilerplate CSS that should be cleaned up.
- If any of the four data-fetching calls (`fetchClients`, `fetchProducts`, `fetchProfileDefaults`, `fetchTemplates`) throw an unhandled error, the component crashes to a white screen with no error boundary catching it. Adding a global error boundary and wrapping these calls more defensively will prevent this.

### 2. Buttons Overlapping in Header
The header bar has the menu button, back button, and "Create Invoice" button. On narrow screens, the back button and menu button crowd together (only `gap-1` spacing), and the "Create Invoice" button on the right can overlap since there's no responsive spacing.

### 3. Sign-Out Button Overlapped
The sidebar's user section at the bottom gets hidden behind the mobile bottom navigation bar (which is ~60px tall). The sidebar needs bottom padding to account for this.

### 4. Back Button Placement
The back button appears right next to the hamburger menu with minimal spacing, making it feel misplaced. It should have clearer visual separation.

---

## Changes

### File: `src/App.css`
- Remove the `#root` styling block that sets `max-width: 1280px`, `padding: 2rem`, and `text-align: center`. This boilerplate CSS conflicts with the full-width dashboard layout and can cause the Create Invoice page (and other pages) to render incorrectly.

### File: `src/App.tsx`
- Add a React Error Boundary component that catches rendering errors and shows a fallback UI with a "Retry" button instead of a white screen. This prevents any component crash from resulting in a completely blank page.

### File: `src/components/DashboardLayout.tsx`
- **Header**: Increase spacing between the menu button and back button from `gap-1` to `gap-2`, and add a subtle visual separator between them so the back button reads as a distinct navigation element.
- **Sidebar bottom**: Add `pb-20 lg:pb-4` to the sidebar's user section so the Sign Out button is not hidden behind the mobile bottom navigation bar.
- **Header buttons**: Ensure the "Create Invoice" button doesn't overlap with navigation buttons by using `flex-shrink-0` on it.

### File: `src/pages/InvoiceNew.tsx`
- Add a top-level `try/catch` wrapper around the component's initial data fetching in the `useEffect`. If all four fetch calls fail, show a user-friendly error state with a "Retry" button instead of crashing to white.
- Add a component-level `loading` state that's `true` until initial data loads, showing a spinner.

---

## Technical Summary

| File | Change |
|------|--------|
| `src/App.css` | Remove conflicting `#root` boilerplate styles |
| `src/App.tsx` | Add ErrorBoundary wrapper around Routes |
| `src/components/DashboardLayout.tsx` | Fix header spacing, sidebar bottom padding for mobile nav |
| `src/pages/InvoiceNew.tsx` | Add loading/error states for initial data fetch |

These changes affect both web and native app since the issues appear on both platforms.
