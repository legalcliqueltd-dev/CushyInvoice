
# Landing Page UI Overhaul -- Gen Z + Neobrutalism

## Overview
Transform the landing page from a standard corporate SaaS look into an energetic, Gen Z-friendly design with neobrutalism accents, animated gradients, background noise texture, and boosted blue saturation.

## What Changes

### 1. Boost Blue Saturation (CSS Variables)
**File: `src/index.css`**
- Increase primary blue from `217 91% 60%` to `220 100% 55%` -- punchier, more saturated blue
- Update accent, ring, and sidebar colors to match
- Keep dark mode consistent with the new saturated palette

### 2. Add Background Noise Texture + Animated Gradient
**File: `src/index.css`**
- Add a subtle SVG noise filter as a pseudo-element overlay on the landing page background using a CSS class `.landing-bg`
- Add a slow-moving animated gradient blob keyframe (`@keyframes blob-float`) for floating gradient orbs in the hero
- Add `.neo-brutal` button class: thick 3px black border, 4px offset box-shadow, translate on hover to create a "press" effect
- Add `.neo-card` class: 2px black border, subtle shadow offset, rounded corners

### 3. Redesign Landing Page Component
**File: `src/pages/Index.tsx`**

**Navigation:**
- Neobrutalism-style nav buttons with thick borders and shadow offsets
- Logo with a colored background pill shape

**Hero Section:**
- Large animated gradient blobs floating behind the text (3 colored circles with blur + animation)
- Bold, oversized heading with a highlighted keyword using a rotated background rectangle (marker highlight effect)
- Subtext in a more casual, Gen Z tone ("stop chasing payments. start vibing with your invoices.")
- CTA buttons with neobrutalism style: thick black borders, shadow offset, hover press animation
- Add a decorative SVG arrow/squiggle doodle near the CTA

**Features Section:**
- Neobrutalism cards with thick borders, colored backgrounds (pastel blue, purple, green, orange), and offset shadows
- Icons inside colored circles with thick borders
- Staggered fade-in animation on scroll (using CSS animation-delay)

**Testimonials:**
- Cards with neobrutalism borders and slight rotation (transform: rotate(-1deg / 1deg / 2deg)) for a casual scattered look
- Colorful avatar circles instead of plain text names
- Star ratings in yellow/gold with thicker styling

**CTA Section:**
- Full-width gradient banner with noise overlay
- Neobrutalism button in contrasting color (e.g., yellow with black border)

**Footer:**
- Cleaner layout, social icons in neobrutalism pill shapes

### 4. Add Tailwind Keyframes for Blob Animation
**File: `tailwind.config.ts`**
- Add `blob-float` keyframe for the animated gradient blobs
- Add `float` animation utility

## Technical Details

### New CSS Classes in `src/index.css`
```css
.neo-brutal-btn {
  border: 3px solid currentColor;
  box-shadow: 4px 4px 0px currentColor;
  transition: all 0.15s ease;
}
.neo-brutal-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px currentColor;
}
.neo-card {
  border: 2px solid hsl(var(--foreground));
  box-shadow: 4px 4px 0px hsl(var(--foreground) / 0.15);
}
.landing-noise::after {
  /* SVG noise texture overlay at low opacity */
}
```

### New Tailwind Keyframes
```text
blob-float: translates and scales blobs in a loop
  0%   -> translate(0, 0) scale(1)
  33%  -> translate(30px, -50px) scale(1.1)
  66%  -> translate(-20px, 20px) scale(0.9)
  100% -> translate(0, 0) scale(1)
```

### Files Changed
| File | Change |
|------|--------|
| `src/index.css` | Boost blue saturation, add noise overlay class, neobrutalism utility classes, blob animation keyframes |
| `src/pages/Index.tsx` | Full redesign with neobrutalism cards/buttons, animated gradient blobs, noise background, Gen Z copy, staggered animations |
| `tailwind.config.ts` | Add blob-float keyframe and float animation |

### What Stays the Same
- All links and routes (privacy, terms, social links, auth navigation)
- WhatsApp support button functionality
- Overall page structure (nav, hero, features, testimonials, CTA, footer)
- The existing `GradientButton` component (still used but supplemented with neo-brutal style buttons)
- Dashboard and all other pages remain untouched
