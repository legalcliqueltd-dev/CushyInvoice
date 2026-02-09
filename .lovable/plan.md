
# Redesign Subscribe Page -- FleetTrackMate Style with Neo Accents

## Overview
Redesign the subscription page to match the FleetTrackMate pricing layout while keeping the existing app background colors (light/dark theme) and applying neobrutalism accents consistent with the rest of the app.

## Changes

### File: `src/pages/Subscribe.tsx`

**Background:** Keep existing `bg-gradient-to-br from-background via-background to-primary/5` -- no dark override.

**Header:**
- Zap icon in a pill badge instead of emoji
- Bold heading: "Choose Your Plan"
- Subtitle about 7-day trial
- Trust badges row (Cancel anytime, No setup fees, Stripe)

**Card Design (FleetTrackMate layout):**
- Use `neo-card-subtle` class for neobrutalism consistency
- Each card gets an icon at top (Zap for Monthly, Star for Yearly)
- Plan name + short subtitle ("Perfect for freelancers" / "Best value for growing businesses")
- Large price display
- Green progress-style bar showing "7 days free" (a rounded div with green bg and white text)
- Feature list with green circle checkmarks (CheckCircle icon)
- Popular card gets `border-primary` and a "Popular" neo-badge in top-right corner

**Buttons:**
- Dark themed CTA: `bg-foreground text-background` with `neo-btn-subtle` class for the press effect
- Keeps existing `handleSubscribe` logic and loading states

**What stays the same:**
- All plan data, prices, price IDs, features
- `handleSubscribe` Stripe integration
- Navigation and routing
- Background color scheme (respects light/dark theme)

### Technical Details

```text
Card structure per plan:
+----------------------------------+
|  [Icon]                 Popular  |
|  Plan Name                       |
|  Short subtitle                  |
|                                  |
|  $2.99 /month                    |
|                                  |
|  [====== 7 days free ========]   |
|                                  |
|  (check) Feature 1               |
|  (check) Feature 2               |
|  (check) Feature 3               |
|  ...                             |
|                                  |
|  [ Start 7-Day Free Trial ]      |
|  No credit card * Cancel anytime |
+----------------------------------+
```

Only one file changes: `src/pages/Subscribe.tsx`
