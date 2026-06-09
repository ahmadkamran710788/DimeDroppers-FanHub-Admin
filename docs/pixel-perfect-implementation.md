# Pixel-Perfect Implementation Reference

This document captures every design decision made while matching Step 1 (Hub Details) of the Setup Wizard to Figma file `A6q6iDHmlco1lsu4BGxcs6`. Use it as the ground truth when building Steps 2–4.

---

## Figma File Reference

- **File key**: `A6q6iDHmlco1lsu4BGxcs6`
- **MCP tool**: `mcp__figma__get_figma_data` with `fileKey` + `nodeId` (format `38:2201`)
- **Key nodes used**:
  - `38:418` — StepIndicator (horizontal pills bar)
  - `38:2201` — Sidebar (full sidebar frame, 236×2106px)
  - `30:140` — Preview outer card (Button C wrapper)
  - `81:1045` — Preview inner image card (Frame 10)
  - `38:2203` — Home nav item (padding reference)

---

## Design Tokens (`app/globals.css`)

```css
/* Colors */
--color-midnight-navy: #0B1C2D
--color-steel-blue:   #3B84C9
--color-success:      #65C162
--color-error:        #FF5257
--color-accent-dark:  #231F20

/* Gradients */
--gradient-cta:  linear-gradient(225deg, rgba(255,52,191,1) 12%, rgba(99,139,254,1) 100%)
--gradient-blue: linear-gradient(180deg, #3B84C9 0%, #3B84C9 100%)

/* Surface opacities */
--color-surface-06:  rgba(255,255,255,0.06)   /* section card bg */
--color-surface-08:  rgba(255,255,255,0.08)   /* preview card bg */
--color-surface-15:  rgba(255,255,255,0.15)   /* avatar bg */

/* Borders */
--color-border-subtle:  rgba(255,255,255,0.2)  /* Tailwind: border-border-subtle */
--color-border-divider: rgba(255,255,255,0.1)  /* divider lines */
--color-border-input:   rgba(11,28,45,0.11)    /* input border */
```

**Tailwind utility aliases** (from `@theme inline`):
| Utility | Value |
|---------|-------|
| `bg-steel-blue` | `#3B84C9` |
| `bg-success` | `#65C162` |
| `bg-error` | `#FF5257` |
| `bg-midnight-navy` | `#0B1C2D` |
| `bg-border-subtle` | `rgba(255,255,255,0.2)` |
| `border-border-subtle` | `rgba(255,255,255,0.2)` |
| `font-display` | Sofia Sans Extra Condensed (via `--font-display`) |
| `font-sans` | Inter (via `--font-sans`) |

**CTA gradient as inline style** (Tailwind can't express multi-stop gradients at this angle):
```tsx
style={{ background: "var(--gradient-cta)" }}
```

**CTA gradient as CSS text clip** (for logo "FAN HUB" text):
```tsx
style={{
  backgroundImage: "var(--gradient-cta)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}}
```

---

## Typography Scale

| Usage | Font | Weight | Size | Case | Line Height |
|-------|------|--------|------|------|-------------|
| Page heading (Configure Hub Details) | Sofia Sans Extra Condensed | 800 | 56px | UPPER | `leading-none` |
| Section card title (Organization & Team Info) | Sofia Sans Extra Condensed | 800 | 28px | UPPER | `leading-tight` |
| Preview card title (PREVIEW) | Sofia Sans Extra Condensed | 800 | 28px | UPPER | 120% |
| Preview org name | Sofia Sans Extra Condensed | 800 | 56px | UPPER | 121% |
| Sidebar logo text | Sofia Sans Extra Condensed | 800 | 28px | UPPER | `leading-none` |
| Header title (Setup Wizard) | Sofia Sans Extra Condensed | 800 | 28px | UPPER | — |
| Nav labels / body / labels | Inter | 500 | 16px | — | 121% |
| Step label in sidebar | Inter | 500 | 14px (`text-sm`) | — | `leading-tight` |
| Avatar initials | Inter | 400 | 48px | — | 0.5em |
| Info row label | Inter | 600 | 16px | — | 150% |
| Info row value | Inter | 400 | 16px | — | 150% |
| Sport label | Inter | 500 | 14px | — | 121% |

---

## Layout Shell (`app/(setup)/layout.tsx`)

```
flex h-screen bg-black overflow-hidden
  ├── <Sidebar />                          w-[236px] shrink-0
  └── div  relative flex flex-col flex-1 overflow-hidden
        ├── <img bg-image />               absolute, top-right, 80% wide, blur(72px), opacity 0.6
        ├── <Header />                     h-20, shrink-0
        └── <main>                         relative z-10 flex-1 overflow-y-auto px-10 py-8
              {children}
```

**Background image** (`/images/hub-bg-3c75bf.png`):
- `position: absolute; top:0; right:0`
- `width: 80%; height: 100%`
- `objectFit: cover; objectPosition: top right`
- `filter: blur(72px); opacity: 0.6; zIndex: 0`

---

## Sidebar (`components/layout/Sidebar.tsx`)

**Figma node**: `38:2201`

### Container
```
w-[236px] shrink-0 flex flex-col h-screen overflow-y-auto
bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px]
shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.2)]
```

### Logo area
```
h-[104px] flex items-start pt-[27px] gap-2 px-10
```
- Height: 104px (Figma nav column starts at y:104 from sidebar top)
- Logo positioned at y:27 from top → `items-start pt-[27px]`
- Left padding: `px-10` = 40px (Figma x:40)
- Icon: `<img src="/icons/logo-union.svg" width={32} height={28} />`
- Text: two spans — `"DIME "` white + `"FAN HUB"` CTA gradient clip

### Navigation wrapper
```
flex-1 py-2 flex flex-col px-4
```
Nav column starts at x:16 within sidebar → `px-4` (16px)

### Nav items (Home, all bottom items)
```
flex items-center gap-2 pl-[12px] pr-4 py-4 rounded-[8px]
text-base font-medium text-white
```
- Active: `bg-[rgba(255,255,255,0.08)]`
- Inactive: `text-white/80 hover:bg-[rgba(255,255,255,0.08)]`

### Setup Wizard CTA button
```
flex items-center gap-2 pl-[12px] pr-4 py-4 rounded-[8px] text-base font-medium text-white
style={{ background: "var(--gradient-cta)" }}
```

### Wizard step sub-items
```
flex items-center gap-3 pl-6 pr-2 py-4 rounded-[8px] group transition-all
```
- **No background highlight** (not even on active step — Figma has none)
- Circle: `w-6 h-6 rounded-full` (24×24px)
  - Active/completed: `bg-steel-blue`
  - Inactive: `bg-[rgba(255,255,255,0.2)]`
  - **No glow ring** (removed — not in Figma)
- Label: `text-sm font-medium whitespace-nowrap`
  - Active: `text-white`
  - Inactive: `text-white/60`

### Dividers
- **None between nav sections** — all three previously-coded `h-px bg-[rgba(255,255,255,0.1)]` dividers were removed
- Only the profile section `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]` remains

### Profile section
```
px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
```
- Avatar: 48×48px circle, `border: 2px solid rgba(255,255,255,0.5)`, `backdropFilter: blur(24px)`

---

## Header (`components/layout/Header.tsx`)

```
h-20 flex items-center justify-between px-10 shrink-0
bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px]
shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.2)]
```
- Title: `font-display font-black text-[28px] uppercase text-white tracking-wide`
- Right side: `gap-6` — help icon (24px) + bell icon (24px) + avatar (48px circle)
- **No name/role text** next to avatar

---

## StepIndicator (`components/common/StepIndicator.tsx`)

**Figma node**: `38:418`

```
flex items-center gap-4 w-full
```

### Pills
Each pill = `flex-1` (fills space equally), pills push apart via `gap-4` (16px) + fixed 50px connectors.

```
flex items-center gap-2 rounded-full px-2 py-2 backdrop-blur-[48px] flex-1
```
- Active/completed: `bg-steel-blue`
- Inactive: `bg-border-subtle` (= `rgba(255,255,255,0.2)`)

### Number circle (inside pill)
```
relative w-10 h-10 shrink-0 flex items-center justify-center
```
- Background ellipse: `absolute inset-0 rounded-full bg-border-subtle` (20% white)
- Number: `relative z-10 text-base font-semibold text-white leading-none`

### Label (always shown, even inactive)
```
text-base font-semibold text-white whitespace-nowrap pr-2
```

### Connectors
```
w-[50px] h-[2px] bg-border-subtle shrink-0
```
Fixed 50px per Figma `Vector 5/6/7` spec.

---

## Hub Details Page (`app/(setup)/setup-wizard/hub-details/page.tsx`)

### Page wrapper
```
flex flex-col gap-6 pb-24
```
`pb-24` reserves space for WizardFooter.

### Heading section
```
flex flex-col gap-2 -mt-2
```
`-mt-2` tightens the gap between StepIndicator and heading to match Figma.

### Two-column layout
```
flex gap-10 items-start
```
- Left (form): `flex flex-col gap-10 flex-1 min-w-0`
- Right (sidebar panels): `w-[480px] shrink-0 flex flex-col gap-6`

### SectionCard (`components/common/SectionCard.tsx`)
```
rounded-[8px] p-6 flex flex-col gap-6 bg-[rgba(255,255,255,0.06)]
```
- Title: `font-display font-black text-[28px] uppercase text-white leading-tight`
- Description: `text-base text-white/80`

### Input fields (`components/common/Input.tsx`)
```
w-full h-12 rounded-[8px] bg-white text-midnight-navy text-base font-medium
px-4 py-3 border-2 border-[rgba(11,28,45,0.11)]
focus:border-steel-blue
```
- Inline: `boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.16)"`, `backdropFilter: "blur(64px)"`
- Icon: absolute left, navy color `text-[#0B1C2D]`, `pl-10` on input when icon present

### Form grid
```
grid grid-cols-2 gap-6
```
Full-width fields: `className="col-span-2"`

---

## Preview Card (`hub-details/page.tsx` right column)

### Outer wrapper
**Figma node**: `30:140` (`Button C`)
```
rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]
style={{ background: "rgba(255,255,255,0.08)" }}
```
- Title "PREVIEW": `font-display font-black text-[28px] uppercase text-white leading-none`

### Inner image card
**Figma node**: `81:1045` (`Frame 10`)
```
rounded-[12px] relative border-2 border-[rgba(255,255,255,0.2)]
style={{
  backgroundImage: "url(/images/preview-bg.png)",
  backgroundSize: "cover",
  backgroundPosition: "center top",
}}
```
- **No `overflow-hidden`** — it clips the border; use `rounded-[12px]` on the gradient overlay instead
- Dark gradient overlay: `absolute inset-0 rounded-[12px]` with `linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,1) 100%)`
- Content: `relative z-10 p-6 flex flex-col gap-4`

### Inside inner card (column, gap-4)
1. **Avatar** — standalone element (NOT in a row with org name):
   ```
   w-24 h-24 rounded-full shrink-0 flex items-center justify-center
   style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.5)", backdropFilter: "blur(48px)" }}
   ```
   Initials text: Inter 400, 32px, white

2. **Org name** — below avatar, separate element:
   ```
   font-display font-black text-[56px] uppercase text-white leading-none w-full
   ```

3. **Radial separator**:
   ```tsx
   <div style={{ height:"2px", background:"radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)" }} />
   ```

4. **Sport row**: `flex items-center gap-2` — `icon-dribbble.svg` 24px + Inter 500 14px text

### Info rows (below inner card, inside outer wrapper)
Each row: `flex items-start gap-2`
- Icon: 24px, `mt-0.5`
- Text column: `flex flex-col gap-2` (Figma `gap: 8px`)
  - Label: `text-base font-semibold text-white` (Inter 600 16px)
  - Value: `text-base font-normal text-white` (Inter 400 16px)

---

## Completion Checklist

Card: `rounded-[8px] p-6 bg-[rgba(255,255,255,0.06)] flex flex-col gap-4`

### Done state
Custom inline SVG — filled green circle with white checkmark:
```tsx
<div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
</div>
```
Label: `text-sm text-success line-through`

### Incomplete state
Lucide `<Circle className="w-5 h-5 text-white shrink-0" />`
Label: `text-sm text-white`

### Branding check condition
```ts
done: (f, logoUploaded) =>
  logoUploaded ||
  f.primaryColor !== "#000000" ||
  f.secondaryColor !== "#000000" ||
  f.accentColor !== "#231F20"
```

---

## Action Bar / Footer

Uses `WizardFooter` component (`components/common/WizardFooter.tsx`).
Page has `pb-24` to prevent content being hidden behind fixed footer.

---

## Public Assets

### Icons (`public/icons/`)
All downloaded directly from Figma as SVGs — use `<img>` tags, not lucide:

| File | Used in |
|------|---------|
| `logo-union.svg` | Sidebar logo (D lettermark, CTA gradient fill) |
| `icon-wand-stars.svg` | Sidebar "Setup Wizard" button |
| `icon-home.svg` | Sidebar Home nav |
| `icon-bolt.svg` | Sidebar Activations |
| `icon-calendar.svg` | Sidebar Schedule |
| `icon-users.svg` | Sidebar Teams |
| `icon-media.svg` | Sidebar Media |
| `icon-business.svg` | Sidebar Sponsors |
| `icon-donations.svg` | Sidebar Donations |
| `icon-analytics.svg` | Sidebar Analytics |
| `icon-settings.svg` | Sidebar Settings |
| `icon-help.svg` | Header help button |
| `icon-help2.svg` | Sidebar Help Center |
| `icon-bell.svg` | Header notifications |
| `icon-dribbble.svg` | Preview card sport row |

### Images (`public/images/`)
| File | Used in |
|------|---------|
| `hub-bg-3c75bf.png` | Layout ambient background (blurred) |
| `preview-bg.png` | Preview card inner image |
| `avatar-photo.png` | Header avatar + Sidebar profile avatar |

---

## Common Patterns for Steps 2–4

Follow these patterns on every wizard step page:

### Page wrapper
```tsx
<div className="flex flex-col gap-6 pb-24">
  <StepIndicator currentStep={N} />
  <div className="flex flex-col gap-2 -mt-2">
    <h2 className="font-display font-black text-[56px] uppercase text-white leading-none">
      Step Title
    </h2>
    <p className="text-base text-white/80">Subtitle text.</p>
  </div>
  {/* content */}
  <WizardFooter onNext={handleNext} onBack={() => router.back()} />
</div>
```

### StepIndicator prop
Pass `currentStep={2}` / `{3}` / `{4}` on the respective pages.

### Section cards
```tsx
<SectionCard title="Section Title">
  <div className="grid grid-cols-2 gap-6">
    {/* fields */}
  </div>
</SectionCard>
```

### Gradient text (for any CTA-gradient text)
```tsx
<span style={{
  backgroundImage: "var(--gradient-cta)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text"
}}>text</span>
```

### Glassmorphic card surface
```tsx
<div className="rounded-[8px] p-6 backdrop-blur-[48px]"
     style={{ background: "rgba(255,255,255,0.08)" }}>
```

### Validation pattern
```ts
import { validateAndSetErrors } from "@/utils/validation";
const valid = await validateAndSetErrors(schema as yup.ObjectSchema<Record<string, unknown>>, form, setErrors);
if (valid) router.push(routes.ui.setupWizard.nextStep);
```

---

## What Was Fixed (Rounds 1–6)

| Round | Issue | Fix |
|-------|-------|-----|
| 1–2 | Initial scaffold | Basic layout, components, routing |
| 3 | Wrong logo SVG | Downloaded exact Figma SVG assets, replaced lucide icons throughout |
| 3 | Header had name/role text | Removed — avatar only per Figma |
| 3 | Dynamic checklist | Made all checklist items reactive to form state |
| 3 | Preview missing bg image | Added `preview-bg.png` from Figma |
| 3 | Action bar was fixed | Made it natural scroll position (`pb-24` + WizardFooter) |
| 3 | Blurred ambient bg missing | Added blurred `hub-bg-3c75bf.png` in layout.tsx |
| 4 | StepIndicator vertical layout | Rewrote to horizontal pills (number+label inline per Figma `38:418`) |
| 4 | Sidebar step active bg highlight | Removed — Figma has no bg on wizard step links |
| 4 | Checklist used lucide CheckCircle | Replaced with custom `GreenCheck` SVG component |
| 4 | Branding always checked | Fixed condition: only checked when colors differ from defaults or logo uploaded |
| 4 | Logo "DIME FAN HUB" single color | Split: "DIME" white + "FAN HUB" CTA gradient clip |
| 4 | Logo row had bottom border | Removed shadow |
| 4 | Preview avatar+name in row | Restructured to column per Figma `81:1045` |
| 4 | Preview separator plain | Changed to radial-gradient stroke |
| 5 | Bg image too blurred | Reduced blur 144px→72px, opacity 0.5→0.6 |
| 5 | StepIndicator inactive steps no label | Removed conditional — all steps always show label |
| 5 | Sidebar glow ring on active step | Removed — not in Figma |
| 5 | Logo row wrong height | Changed `h-20`→`h-[104px]`, aligned to `items-start pt-[27px]` |
| 6 | StepIndicator pills not filling width | Pills `flex-1`, connectors fixed 50px |
| 6 | Sidebar dividers between sections | Removed all three — Figma has none |
| 6 | Logo top padding direction wrong | Changed `items-end pb-[27px]` → `items-start pt-[27px]` |
| 6 | Preview card border clipped | Removed `overflow-hidden`; added `rounded-[12px]` to overlay instead |
| 6 | Preview card heading spacing | Added `-mt-2` to tighten gap between StepIndicator and heading |
| 6 | Info row inner gap too tight | Changed `gap-1`→`gap-2` to match Figma 8px |

---

## Step 4 — Review & Publish (`review-publish/page.tsx`)

**Figma node**: `52:2788` (frame "1.6 - Setup Wizard (Step 4)")

### Two-column body
```
flex gap-10 items-start
  ├── LEFT   w-[348px] shrink-0 flex flex-col gap-10   (two stacked cards, 40px apart)
  └── RIGHT  flex-1 min-w-0 flex justify-center        (light preview card, centers the phone)
```

### Left cards (both `SectionCard`)
Both use `className="bg-surface-07"` (= `rgba(255,255,255,0.07)` — note: **0.07**, not Step 1's 0.06).
Title "Configuration Summary" comes from the standard `SectionCard` title (Sofia 800 / 28px / uppercase).

**Card 1 — section rows** (Hub Details / Schedule / Activations):
- Rows have **no leading icon**. Title `text-base font-semibold text-white`; value lines
  `text-sm text-white/40` (Schedule has two lines).
- Right side is a column `flex flex-col items-end gap-4`:
  - **Complete badge** — `icon-check-circle.svg` (24px, green `#65C162` baked into the SVG) +
    "Complete" `text-xs text-success`. **No pill background.**
  - **Edit button** — `<Link>` `h-6 px-3 rounded-[4px] text-xs text-white backdrop-blur-[48px]`,
    inline `background: rgba(235,235,235,0.25)`.
- 1px `bg-border-divider` between rows (rendered before each row after the first).

**Card 2 — checklist + secure footer**:
- Checklist items: `icon-check-circle.svg` (24px) + label `text-base text-success` (green, **no
  strikethrough** — differs from Step 1's checklist which used line-through). Items `gap-4`.
- 1px `bg-border-divider`, then **"Your Fan Hub is Secure"** footer: `icon-shield-check.svg`
  (24px, white) + title `text-base font-semibold text-white` + body `text-xs text-white`.
  **No background box** (do NOT wrap in a blue `bg-[rgba(59,132,201,0.1)]` panel).

### Right preview card (light panel — built inline, NOT via SectionCard)
Because the title/description must be **navy** (not the hard-white `SectionCard` title), the card is
hand-built:
```tsx
<div className="w-full rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] items-center"
     style={{ background: "rgba(255,255,255,0.9)" }}>
  <h3 …text-midnight-navy>Fan Hub Preview</h3>   // Sofia 800 / 28px / uppercase
  <p …text-xs text-midnight-navy>This is how your Fan Hub will look to your fans.</p>
  <div className="h-px bg-[rgba(0,0,0,0.1)]" />
  <FanHubPhonePreview />
</div>
```

### FanHubPhonePreview (`components/setup/FanHubPhonePreview.tsx`)
Prop-driven dark phone mockup. **Backend supplies** `schoolName`, `logoSrc`, `heroSrc`,
`brandColor`, `location`, `website` — all optional with Figma defaults. The teal `brandColor`
(`#0B6F81`) drives the hero overlay gradient, the TODAY pill, and the active Home tab pill (via the
`hexToRgba` helper for the overlay's two stops).

Structure (top→bottom), width `360px`, body gradient `linear-gradient(180deg, rgba(6,8,14,1),
rgba(0,0,0,1))`, `rounded-[28px]`:
1. Header bar — `logo-union.svg` + "FAN HUB" (`font-display`, fallback for "Third Rail - Demo").
2. Hero card (`rounded-[12px]`, teal-gradient-over-image): circular crest (86px,
   `rgba(255,255,255,0.15)` bg, `1.7px rgba(255,255,255,0.5)` border, `blur(42px)`), school name
   (Sofia 800 / 44px / uppercase), location (`icon-pin.svg`) + website (`icon-external-link.svg`)
   row, radial-gradient hairline, social row (`icon-socials.svg`, one flattened SVG), Favorite
   (`icon-star.svg`) / Share (`icon-share.svg`) pills (`rgba(235,235,235,0.25)`, `rounded-[7px]`).
3. SCHEDULE header + TODAY pill (teal, `icon-angle-down.svg`).
4. Filter chips — Activities/Level/Gender(1), `rounded-full bg-[rgba(255,255,255,0.15)]`, each with
   icon + chevron (Gender shows `icon-close-sm.svg`).
5. Glass tab bar — 5 tabs (`icon-tab-*.svg`), active Home wrapped in teal pill + home indicator.

### New assets
- `public/images/preview-hero.png`, `public/images/preview-crest.png`
- `public/icons/`: `icon-check-circle.svg`, `icon-shield-check.svg`, `icon-pin.svg`,
  `icon-external-link.svg`, `icon-star.svg`, `icon-share.svg`, `icon-socials.svg`,
  `icon-sport.svg`, `icon-chart-bar.svg`, `icon-users-alt.svg`, `icon-angle-down.svg`,
  `icon-close-sm.svg`, `icon-tab-home.svg`, `icon-tab-star.svg`, `icon-tab-wallet.svg`,
  `icon-tab-notification.svg`, `icon-tab-more.svg`

### New design token
`--color-teal: #0B6F81` (added to both `:root` and `@theme inline` in `app/globals.css`).

### Known minor deviations
- "FAN HUB" wordmark uses `font-display` (Sofia) — the Figma font "Third Rail - Demo" isn't bundled.
- Social icons are one flattened SVG (`icon-socials.svg`), not individually interactive — fine for a
  static preview.
- Tab-bar "Liquid Glass" effect approximated with `backdrop-blur` + a translucent fill.
