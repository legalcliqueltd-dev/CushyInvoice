

# Settings Page and Navigation UI Fixes

## Issues Identified

1. **Settings tabs require horizontal scrolling** -- the 6 tabs overflow on mobile, forcing the user to slide to see "Appearance" and "Security"
2. **Header obstructed by phone status bar** -- the `safe-top` padding isn't applying correctly on the sticky header
3. **Buttons too large** -- the "New" button and theme toggle in the header have oversized touch targets (44px min)
4. **Bottom nav bar needs rounded corners, larger size, and "Settings" instead of "More"**

## Changes

### 1. Settings Tabs: Vertical List on Mobile (Settings.tsx)

Replace the horizontal scrolling `TabsList` with a vertical stack on small screens that switches to the current horizontal grid on larger screens. This eliminates the need to slide sideways entirely.

- On mobile: render tabs as a 2-column grid so all 6 tabs are visible without scrolling
- On desktop: keep the current 6-column horizontal layout

### 2. Fix Header Safe Area (DashboardLayout.tsx)

Move `safe-top` from inside the sidebar to the `header` element's padding so the sticky top bar accounts for the phone notch/status bar. Add `pt-[env(safe-area-inset-top)]` directly to the header.

### 3. Reduce Button Sizes (DashboardLayout.tsx)

- Shrink the "New" / "Create Invoice" button from `min-h-[44px]` to `h-9` (standard small)
- Shrink the theme toggle from `min-h-[44px] min-w-[44px]` to `h-9 w-9`
- Reduce icon sizes from `h-5 w-5` to `h-4 w-4` in the header buttons

### 4. Bottom Nav: Rounded Corners, Larger, "Settings" Label (index.css + DashboardLayout.tsx)

- Add `rounded-t-2xl` and increase padding/height on `.mobile-bottom-nav`
- Change the last bottom nav item from "More" (MoreHorizontal icon) to "Settings" (Settings icon) that navigates to `/settings` instead of opening the sidebar
- Mark the Settings bottom nav item as active when on `/settings`

## Technical Details

**Files modified:**
- `src/pages/Settings.tsx` (lines 346-356) -- change TabsList layout to 2-col grid on mobile
- `src/components/DashboardLayout.tsx` -- header safe area, smaller buttons, bottom nav "Settings" replacement
- `src/index.css` (lines 517-527) -- bottom nav rounded corners and increased size
