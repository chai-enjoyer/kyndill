---
name: Kyndill
description: A warm habit tracker built around a virtual pet companion. Tend small flames daily; missed days are welcomed back.
colors:
  candle-cream: "oklch(0.965 0.008 75)"
  warm-surface: "oklch(0.945 0.010 75)"
  ember-bark: "oklch(0.18 0.008 50)"
  charred-oak: "oklch(0.22 0.010 50)"
  sage: "oklch(0.55 0.05 145)"
  sage-deep: "oklch(0.46 0.06 145)"
  honey-gold: "oklch(0.78 0.10 80)"
  honey-deep: "oklch(0.66 0.12 75)"
  ember: "oklch(0.58 0.13 50)"
  ink-walnut: "oklch(0.22 0.015 45)"
  bone-vellum: "oklch(0.92 0.008 70)"
  ash-muted: "oklch(0.50 0.013 50)"
  ash-faint: "oklch(0.68 0.010 55)"
  rule-line: "oklch(0.88 0.012 70)"
  rule-line-faint: "oklch(0.92 0.008 70)"
  rule-line-dark: "oklch(0.32 0.012 130)"
  hover-tint-dark: "oklch(0.27 0.012 130)"
typography:
  display:
    fontFamily: "Manrope, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.625rem, 4.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  section-heading:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  habit-name:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  category-tag:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.04em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  numeric:
    fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "14px"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  xxl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.candle-cream}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.body-small}"
  button-primary-hover:
    backgroundColor: "{colors.sage-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-walnut}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.warm-surface}"
  chip-streak:
    backgroundColor: "transparent"
    textColor: "{colors.honey-deep}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
    typography: "{typography.numeric}"
  chip-coins:
    backgroundColor: "transparent"
    textColor: "{colors.ink-walnut}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
    typography: "{typography.numeric}"
  habit-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink-walnut}"
    rounded: "{rounded.sm}"
    padding: "14px 0"
    typography: "{typography.habit-name}"
  habit-row-hover:
    backgroundColor: "{colors.warm-surface}"
  habit-row-hover-dark:
    backgroundColor: "{colors.hover-tint-dark}"
  input-text:
    backgroundColor: "{colors.candle-cream}"
    textColor: "{colors.ink-walnut}"
    border: "1px solid {colors.rule-line}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    minHeight: "44px"
    typography: "{typography.body}"
  input-text-focus:
    border: "2px solid {colors.sage}"
    boxShadow: "0 0 0 3px oklch(0.55 0.05 145 / 0.12)"
  checkbox-toggle:
    minSize: "24px"
    tapTarget: "44px"
    rounded: "{rounded.sm}"
    typography: "{typography.body}"
  category-tag:
    backgroundColor: "transparent"
    textColor: "inherit"
    rounded: "{rounded.full}"
    padding: "3px 8px"
    typography: "{typography.category-tag}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ash-muted}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.label}"
  nav-link-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink-walnut}"
---

# Design System: Kyndill

## 1. Overview

**Creative North Star: "The Well-Worn Notebook"**

Kyndill is a habit tracker that should feel like a notebook you've kept for a year, or a plant you've kept alive that long: warm, grounded, slightly imperfect, carrying the weight of repeated small acts without performing them at you. The visual system is built around tinted warm-neutrals (no `#fff`, no `#000`, no harsh paper white, no inky black), a single primary sage accent that suggests something living, and a honey gold reserved for the candle flame and streak motif. Type is two families only: Manrope for display and short headings (rounder, warmer than typical sans), Inter for body and UI text. Numbers and stats use a monospace so a 7-day streak and a 70-day streak hold the same alignment.

The system explicitly rejects the AI-tooling and SaaS-dashboard aesthetics: no purple gradients, no glowing cards, no card-on-card nesting, no hero-metric templates with sparklines, no identical icon-label tab bars. It also rejects fitness-tracker aggression (ring closures, neon-on-black) and todo-app sterility (linear checklist as the front page). Where another habit app would build a grid of metric panels, Kyndill builds a single breathing page: typography hierarchy and quiet dividers separate sections, not borders and shadows. On mobile, content flows as rows, not as a grid; on desktop the extra space is used for context and density, not just larger type.

Layout philosophy lives here, not in its own section: **not everything needs a box around it.** A habit is a row with a circle to tap, a name, and a small streak number, with hairline dividers between rows. The pet's stats are a label-and-value pair on a tinted strip, not a card. The dashboard greeting is text with a progress ring beside it, not a metric tile. Cards are used sparingly: the shop item, the friend profile preview, the modal. Nested cards are forbidden. When in doubt, dissolve the box.

**Key Characteristics:**
- **Mobile-first at 390px.** Designed first for iPhone 14 in mobile Chrome and Safari; tablet and desktop expand gracefully but never just stretch.
- **Two type families only.** Manrope (display + headings), Inter (body + UI), plus a system monospace for numeric stats. No third font.
- **Restrained color strategy.** Tinted warm-neutrals plus sage as the primary accent; honey gold and ember are reserved for the flame, streak chip, and recovery surfaces. The brand never exceeds ~10% of any screen.
- **Dark mode is a peer, not a toggle afterthought.** Both modes feel equally warm because both modes are tinted toward the brand hue, not desaturated grays.
- **Dividers, whitespace, typography hierarchy over borders and shadows.** Most surfaces are flat at rest. The shadow vocabulary exists but is used at modal/dialog tier and on the pet sprite only.
- **44×44px minimum touch target** on every interactive element, with safe-area-aware bottom padding so important actions never hide under Safari's toolbar.

## 2. Colors: The Banked-Hearth Palette

Tinted warm-neutrals plus one primary accent that's alive (sage) and one secondary that's lit (honey). The neutral chroma is intentionally non-zero (`0.005`–`0.012`): every gray leans toward the brand hue, so light mode feels like cream paper and dark mode feels like dim wood, never office white and never abyss black.

### Primary

- **Sage** (`oklch(0.55 0.05 145)` / approx `#7A9B76`): the primary accent. Used for active states, completion strokes, the brand mark's outer flame, the primary button background, and the focus ring. Lives in the 5–10% of the screen reserved for "the one voice."
- **Sage Deep** (`oklch(0.46 0.06 145)`): hover/pressed state for sage. Also used for text on tinted sage backgrounds where contrast against light cream would fail.

### Secondary

- **Honey Gold** (`oklch(0.78 0.10 80)` / approx `#D4A574`): the flame color. Used on the candle illustration, the streak chip glyph, the inner flame on the brand mark, and recovery surfaces where warmth needs to read as comforting rather than alarming.
- **Honey Deep** (`oklch(0.66 0.12 75)`): the contrast variant for streak numerals and chip text against cream surfaces.

### Tertiary

- **Ember** (`oklch(0.58 0.13 50)`): used sparingly, for the live flame motion, the recovery reflection prompt, and the destructive-but-soft "you missed a day" tone. Never the primary chrome color.

### Neutral

- **Candle Cream** (`oklch(0.965 0.008 75)` / approx `#FDFBF7`): page background in light mode. Tinted warm; never `#fff`.
- **Warm Surface** (`oklch(0.945 0.010 75)` / approx `#F5F1E8`): the sunken or grouped surface tier in light mode (used sparingly; flat-by-default).
- **Ember Bark** (`oklch(0.18 0.008 50)` / approx `#1C1E1A`): page background in dark mode. Tinted warm charcoal; never `#000`.
- **Charred Oak** (`oklch(0.22 0.010 50)` / approx `#252821`): the surface tier in dark mode.
- **Ink Walnut** (`oklch(0.22 0.015 45)` / approx `#2D2A24`): body text in light mode.
- **Bone Vellum** (`oklch(0.92 0.008 70)` / approx `#F0EBE0`): body text in dark mode.
- **Ash Muted** (`oklch(0.50 0.013 50)` / approx `#8C8578`): secondary text (timestamps, captions, helper copy).
- **Ash Faint** (`oklch(0.68 0.010 55)`): tertiary text and placeholder text.
- **Rule Line** (`oklch(0.88 0.012 70)`): hairline divider color in light mode; this is the workhorse of separation in this system.

### Named Rules

**The One Voice Rule.** Sage is used on ≤10% of any given screen. Its rarity is the point: completion strokes, active-tab indicators, the primary CTA, focus ring. If you find sage on a third of the screen, demote it.

**The Tinted-Neutral Rule.** Forbidden hex values: `#000`, `#fff`, `#111`, `#222`, and any pure grayscale below chroma 0.005. Every neutral leans toward the brand hue family (warm yellow-orange-green axis). Cool grays read as office software and break the well-worn-notebook feel instantly.

**The Two-Warm-Modes Rule.** Dark mode is not "the light mode with inverted lightness." Both modes are tinted toward the same warm hue. Light mode tops out at Candle Cream (`L 0.965`); dark mode bottoms out at Ember Bark (`L 0.18`). Neither extreme touches grayscale.

**The Reserved-Accent Rule.** Honey gold is the flame color: brand mark inner flame, streak glyph, candle on the login page, recovery prompts. It is never used for arbitrary decoration or "to add a pop of color." Ember is even rarer: live flame motion and the "you've missed days" recovery moment only.

## 3. Typography: Notebook + System

**Display Font:** Manrope (with system-ui fallback)
**Body Font:** Inter (with system-ui fallback)
**Numeric / Stats Font:** system monospace (JetBrains Mono if available, otherwise `ui-monospace` / `SF Mono` / Menlo)

**Character:** Manrope is the warmer of the two: a humanist sans with rounder terminals and slightly tighter optical sizing, which is why it gets the display role. Inter handles small body text, captions, and UI labels where neutrality and clarity matter more than character. The mono font carries every number that needs to align in a column (streak days, coin balance, XP totals, completion percentages, focus session duration) so a 7-day streak and a 70-day streak don't reflow the row.

### Hierarchy

- **Display** (Manrope 600, `clamp(1.625rem, 4.5vw, 2.5rem)`, line-height 1.15, letter-spacing -0.015em): used once per page, top of dashboard greeting and onboarding screens. Never used decoratively mid-page.
- **Headline** (Manrope 600, `1.375rem`, line-height 1.2): section openers ("Today's habits", "Your pet", "Friends"). One per visual group, never repeated within the same group.
- **Section Heading** (Manrope 600, `1.125rem` / 18px, line-height 1.2, full opacity, **8px bottom margin** before its content): the workhorse heading for subsection blocks within a page (e.g. "Pet care", "Mood pings", "Inventory"). Identical metrics to Title, but the named role is "this opens a content block." If you find yourself dropping it to 14–15px to make it feel quieter, raise the spacing around it instead — the 18px size is load-bearing for readability and for hierarchy parity with body text.
- **Title** (Manrope 600, `1.125rem`, line-height 1.2): modal title; the friend profile name; the habit detail header. Use when the line is a noun-phrase identifier, not a section opener.
- **Body** (Inter 400, `1rem` / 16px, line-height 1.5, max-width 65ch): the workhorse. Reflection text, habit descriptions, helper copy, modal body text. **Body must never render below 15px on mobile or 14px on desktop.** The 16px default exceeds both floors; if a constrained context forces a smaller size, clamp at those floors and stop.
- **Body Small** (Inter 400, `0.875rem` / 14px, line-height 1.5): secondary copy under a primary line; mood-ping options; settings descriptions. Permitted on desktop. On mobile, scale to 0.9375rem (15px) — body-small is the smallest reading size allowed on the phone.
- **Habit Name** (Manrope 600, `1rem` / 16px, line-height 1.3, letter-spacing -0.005em): the habit name in a habit row. Semibold for legibility at glance. **Never truncated on mobile** — wrap to a second line rather than `text-overflow: ellipsis`. The habit is the thing the user came to interact with; losing its name to a `…` is a failure mode.
- **Numeric** (mono 500, `1rem` / 16px minimum, line-height 1.0, letter-spacing -0.005em): streak counts, coin balance, freeze count, XP, focus minutes, mood-ping percentages. **Never used for prose, never rendered below 16px.** Stats stay legible at arm's length. Line-height collapses to 1.0 because monospace digits have no descenders and the tight rhythm makes columns of stats sit on a clean grid.
- **Label** (Inter 500, `0.75rem` / 12px, line-height 1.3, letter-spacing 0.05em, normal case, color **Ash Muted**): chip labels, nav labels, captions, status pills, "STREAK" / "CATEGORY" / "STAGE" style metadata labels. **Stays normal-case** — the slightly wider tracking (0.05em) does the UI-label job without invoking the SaaS-uppercase reflex.
- **Category Tag** (Inter 500, `0.6875rem` / 11px, line-height 1.3, letter-spacing 0.04em, normal case): the small inline tag for a habit's category. Rendered as a pill with a **15%-opacity tint of the category color** as the background and the **full-strength category color** as the text. Normal case; the tint is the affordance, not the case.

### Named Rules

**The Two-Family Rule.** Manrope and Inter, full stop. Plus a system monospace for numbers. A third typeface is forbidden, including "just one cute serif for the brand moment." The brand moment is the candle illustration on the login page; type doesn't carry it.

**The Numbers-Are-Mono Rule.** Any stat that lives in a column (streak, coins, freezes, XP, level, focus session length, mood-ping percentages) renders in mono. Prose numerals (a date in a sentence, "3 friends pending") stay in Inter. The rule keeps stats legible across screen sizes and stops "70 → 7" from jumping when the user completes a habit.

**The No-Caps-Tab-Bar Rule.** Navigation links, chip labels, secondary metadata labels, category tags, and buttons use normal case with subtle letter-spacing (0.04–0.05em), never uppercase. Uppercase labels are the icon-label tab bar tell that the user explicitly rejected — the tracking does the UI-label work without invoking the SaaS reflex.

**The Readability Floor Rule.** Body never renders below 15px on mobile or 14px on desktop. Numeric stats never render below 16px. Habit names never truncate on mobile — they wrap. Text the user actually needs to read never drops below **50% opacity**; if a moment calls for "dim," demote to `Ash Muted` (which is opaque) rather than reaching for opacity. Line height is **1.5 for body**, **1.2 for headings**, **1.0 for numeric stats** sitting in a column. The product is read in short, distracted moments; readability is not a place to be clever.

## 4. Elevation

Kyndill is **flat by default.** Depth comes from background tint shifts, hairline dividers (`Rule Line`), and typography hierarchy. Shadows are not the primary way to show that one thing is on top of another.

There are two reasons to use a shadow at all:
1. **Modal / dialog tier.** Anything that floats above the page (confirmation modal, settings sheet, image preview, focus completion celebration) gets `shadow-2`. This is the only time a card visually lifts off the page.
2. **The pet sprite.** The pet has a soft ground shadow because the pet is the only object on the page with physicality. The shadow grounds it; it is not a UI affordance.

Everything else — cards in the shop, the dashboard sidebar, habit rows, the focus timer, friend tiles — sits flush. If you want to separate two regions, use either a hairline divider in `Rule Line` or a tinted background swap to `Warm Surface`. Not both, and never with a shadow.

### Shadow Vocabulary

- **shadow-1** (`0 1px 2px oklch(0.20 0.02 50 / 0.06), 0 1px 1px oklch(0.20 0.02 50 / 0.04)`): the lightest shadow in the system. Reserved for **hover-only** states on actionable surfaces (shop card on hover, friend tile on hover), never a default. Almost imperceptible; it's a "this is interactive" cue, not a depth cue.
- **shadow-2** (`0 6px 18px oklch(0.20 0.02 50 / 0.09), 0 2px 5px oklch(0.20 0.02 50 / 0.05)`): modal, popover, and the pet sprite's ground shadow. In dark mode, shadows ramp up: the base color shifts to near-black with much higher opacity (0.40–0.50) because dim surfaces need more shadow to read as floating.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as: (a) state-change feedback (hover on a tappable card), or (b) genuine z-layer separation (modal, popover, pet sprite). A card sitting still on a page never has a shadow.

**The No-Glow Rule.** Glow / blur effects are forbidden. No `box-shadow` with chroma in the inner color, no `filter: drop-shadow(... with color ...)`, no purple or blue rim lights. The candle flame's soft halo is rendered as an SVG `feGaussianBlur` on the flame path itself, not as a CSS glow on its container. **One exception:** the input focus ring may carry a single 3px sage halo at ≤12% alpha (see input spec below). It is the only chroma-tinted shadow allowed anywhere in the system; treat any other instance as a bug.

## 5. Separation and Rhythm

Cards are the lazy answer. In Kyndill, section separation is built from three quiet primitives, in this order of preference: **vertical rhythm**, **hairline dividers**, **tinted background bands**. Reach for a bordered container only when an element genuinely needs to be isolated.

### The Three Primitives

**1. Vertical rhythm.** Spacing IS the separator. Between distinct sections leave **32–48px** (`xl`–`xxl`); between related items inside a section leave **16px** (`md`). Cap container vertical padding at `xl`; the breathing happens in the gaps between blocks, not by inflating the blocks.

**2. Hairline dividers.** A single `1px` line in `Rule Line` (light, approx `#E0D8C8`) or `Rule Line Dark` (dark, approx `#3A3D35`). One line, full opacity, no shadow underneath. Dividers go between rows of a list and between sub-blocks of a section, never as a decorative flourish.

**3. Tinted background bands.** Alternate adjacent sections between the page background and the surface tier — `Candle Cream` / `Warm Surface` in light, `Ember Bark` / `Charred Oak` in dark — to make a long page feel like layered paper instead of a wall of identical surface. Use sparingly; one band switch per visible viewport is plenty.

### When a Bordered Container IS Justified

Reach for a real card only when the element must read as physically separate from the page:

- Modals, dialogs, popovers, and sheets (they float above content).
- The active pet panel on the dashboard (the pet has physicality and needs grounding).
- Shop items and friend tiles (each is a discrete product the user can act on individually).
- Confirmation surfaces inside destructive flows.

Everything else — habit rows, stat readouts, settings groups, activity entries, journal items, sidebars, summary blocks — uses rhythm + dividers + tinted bands.

### List Rows Get a Bottom Border, Not a Card

A list of items (habits, notifications, friends in a list, journal entries, inventory entries, settings rows) gets a hairline `Rule Line` bottom border per row. The row itself stays flat: transparent background at rest, a tinted hover at `Warm Surface` (light) or `Hover Tint Dark` (dark). No padding-as-card, no per-row shadow, no per-row border on all four sides. The last row in a list may drop its bottom border to avoid a trailing line under whitespace.

### Named Rules

**The Dissolve-the-Box Rule.** Before wrapping anything in a bordered container, ask: would rhythm + a hairline divider + a section heading achieve the same separation? If yes, do that instead. The only valid reasons to keep the box are listed above. "It looks too floaty without one" is not a reason; either the heading is too quiet or the spacing is too tight.

**The Hairline-Only Rule.** Dividers are exactly `1px`. There is no 2px, 3px, or "thicker for emphasis" divider in the system. Emphasis is built with spacing and heading weight, never by fattening the line. Side-stripe borders (a colored 4px `border-left` on a row or callout) are an absolute ban — never used.

**The Rhythm-Then-Color Rule.** When two adjacent sections need to read as distinct, first try widening the gap between them to `xxl`. If that doesn't read, add a hairline divider. Only after both fail do you swap one of them to the tinted-surface band. Color is the loudest of the three primitives; reach for it last.

## 6. Components

### Buttons

- **Shape:** Gently rounded (`rounded.md`, 8px). The full pill (`rounded.full`) is reserved for chips.
- **Sizing:** **Minimum 44px height** on every button, regardless of label length or context. Vertical padding flexes to hit the 44 floor; horizontal padding stays 16px.
- **Primary (Sage):** Sage background, Candle Cream text, vertical padding to 44px min, 16px horizontal, Body Small typography. Always has a visible filled background — **never ghost-only for a primary action.** Hover/pressed shifts the background to Sage Deep with a 150ms ease-out fade. Focus ring is a 2px Sage outline with 2px offset.
- **Ghost:** Transparent background, Ink Walnut text, same sizing. Hover lifts the background to Warm Surface. Default for tertiary actions and toolbar buttons; primary actions never use this style.
- **Destructive:** Ghost variant with text in Ember. Confirmation modal required for any destructive action.
- **Label:** Every button has a written label. Icon-only is allowed only for chrome controls (close, back, settings gear) and even then carries an `aria-label`.

### Habit Row (signature component)

Not a card. A row, dividers between.

- **Layout:** A grid: drag-handle (24px, optional) · circular checkbox (24px minimum visual, tap target padded to 44×44) · habit name (Habit Name typography, Ink Walnut) · category tag (optional, see Category Tag below) · streak badge (numeric mono 16px, Honey Deep) · meta caption (Label, Ash Muted) · hover actions (Ghost icon buttons that appear at ≥768px only).
- **Background:** Transparent at rest. **Tappable hover/active state lifts to `Warm Surface` (light) or `Hover Tint Dark` (dark, approx `#2F332A`).** The hover state is non-optional: every row in this app that responds to a tap shows it.
- **Separation:** Hairline `Rule Line` divider between rows (`Rule Line Dark` in dark mode). No padding-as-card, no border around the row itself, no shadow.
- **Habit name:** Manrope Semibold 16px (the Habit Name token). **Wraps to a second line on mobile rather than truncating with an ellipsis.** Tap target spans the whole row.
- **Completed state:** The checkbox fills with Sage and animates a check stroke. The habit name text shifts to Ash Muted, but never below 50% opacity, and never strikes through. (Strike-through reads as cancellation; we want completion to feel like crossing off in a notebook.)
- **Vertical rhythm:** 14px top/bottom padding per row. On mobile, the entire row is the tap target.

### Row Hover / Active State (universal)

Every tappable row in the system — habit rows, friend list rows, notification entries, inventory items, journal entries, settings rows — uses the same hover/active treatment so the affordance reads as one consistent thing:

- **Light mode:** background shifts to `Warm Surface` (`#F5F1E8`).
- **Dark mode:** background shifts to `Hover Tint Dark` (`#2F332A`).
- **Transition:** 120ms ease-out fade.
- **Active (pressed):** background holds the hover tint and gains a 1px `Rule Line` inset on the bottom edge for tactile feedback.
- **Touch:** the tint appears on `:active` (not just `:hover`), so it fires on mobile taps. Pair with `-webkit-tap-highlight-color: transparent` to suppress the default blue/grey square.

If a row visually looks tappable but has no hover state, that is a bug — the row is lying about being interactive.

### Chips

- **Style:** Pill (`rounded.full`), no background by default, with the icon and value visible inline. Padding 6×10px. Border only when emphasized.
- **Streak chip:** FlameIcon + numeric mono streak count, Honey Deep color. Used in the top nav. When the streak is at risk, the icon flickers (CSS animation, reduced-motion safe).
- **Coins chip:** Coin glyph + numeric mono balance. Always visible in the top nav, linked to /shop.
- **Freeze chip:** Snowflake glyph + `n / 3` ratio. Greyed (`is-empty`) when n=0 so the user knows immediately whether they have a buffer.

### Cards (the few times we use them)

- **Corner Style:** `rounded.lg` (14px) for shop items, friend tiles, modal containers. `rounded.md` (8px) for inline grouped controls.
- **Background:** `Candle Cream` page → `Warm Surface` card tint. In dark mode: `Ember Bark` page → `Charred Oak` card tint.
- **Shadow Strategy:** None at rest. `shadow-1` on hover for actionable cards (shop item, friend tile). `shadow-2` for modals.
- **Border:** A single `Rule Line` hairline border when contrast against page is too weak (light-mode cards). Dark mode usually doesn't need a border because the tint shift is enough.
- **Internal Padding:** `lg` (1.5rem) on desktop, `md` (1rem) on mobile. Nesting cards inside cards is forbidden.

### Inputs

- **Style:** Cream background, Ink Walnut text, **1px `Rule Line` border** (approx `#E0D8C8`), `rounded.md` corner, 10×12px padding.
- **Sizing:** **Minimum height 44px.** The 10×12px padding combined with Body line-height already reaches 44px on standard fonts; if the rendered field falls short, pad up to the floor.
- **Focus:** Border thickens to **2px Sage** plus a **single subtle sage halo** (`0 0 0 3px oklch(0.55 0.05 145 / 0.12)`). Applies to `:focus-visible`. This focus ring is the **only chroma-tinted shadow allowed** in the system; it exists so a keyboard user never loses the cursor against a cream field. No other component may borrow the pattern.
- **Error:** Border shifts to Ember, helper text appears in Ember below the field. The field itself does not turn red; we want errors to read as helpful, not alarming.
- **Disabled:** Background tints to Warm Surface, text to Ash Faint. No strikethrough, no diagonal bars.

### Checkboxes and Toggles

- **Size:** **24px minimum** visible control, padded to a 44×44 tap target. The visible size never drops below 24px regardless of context (settings list, modal, inline form).
- **Layout:** **Label on the left, control on the right** in every settings-style list. The label is the primary content; the control is the answer. Inline-form checkboxes (e.g. "I agree to…") put the control to the left of the label per HTML convention.
- **Checkbox visual:** Square with `rounded.sm` corners, 1px `Rule Line` border at rest, fills to Sage with a Candle Cream check stroke when active. Focus ring matches inputs (2px Sage outline + halo).
- **Toggle (switch) visual:** Pill track 44×24px, knob 20×20px with 2px inset. Track fills Sage when on, stays `Warm Surface` (light) / `Charred Oak` (dark) when off. Knob animates 150ms ease-out across the track.
- **Label typography:** Body (16px) for primary settings; Body Small (14px desktop / 15px mobile) for the secondary description line underneath.
- **Hit anywhere on the row:** in a settings list, tapping the label or its description toggles the control. The whole row is the affordance.

### Category Tag

The small inline pill that marks a habit's category (Health, Learning, Mind, Home, etc.). Used inside the habit row and on the habit detail header.

- **Shape:** `rounded.full` pill, 3×8px padding, no border.
- **Background:** the category's hue at **15% opacity** (e.g. Sage at 15% for Health, Honey Deep at 15% for Learning). The hue is per-category; the strategy is the same.
- **Text:** the same category hue at full strength, Category Tag typography (Inter 500, 11px, normal case, 0.04em tracking).
- **Never uppercase.** The tinted pill is the affordance; the case stays calm.
- **Density:** at most one tag per habit row on mobile; up to three side-by-side on desktop. Wrapping is allowed but rare — a habit with more than three categories is a tagging bug, not a layout problem.

### Navigation

- **Top Nav (desktop):** Brand mark (flame icon + "Kyndill" wordmark) on the left, nav links in the center, chips + avatar + bell + settings on the right. Nav links: Label typography (normal case, slight tracking), Ash Muted at rest, Ink Walnut + a 2px Sage underline when active. Hover lifts text to Ink Walnut without the underline.
- **Top Nav (mobile, ≤768px):** Brand mark + chip group (streak + coins + freeze) collapsed to a single horizontal-scroll strip. Nav links move to a bottom action bar.
- **Bottom Action Bar (mobile only):** Five primary destinations (Dashboard, Habits, Pet, Friends, Profile) as icon + label, fixed to the bottom with `env(safe-area-inset-bottom)` padding so it sits above the Safari toolbar. **Not a generic icon-label tab bar:** icons are custom (the flame is the candle icon, not a generic home), labels stay normal-case, the active state uses a sage dot under the icon, not a filled pill or background change. 44×44px minimum tap target per item.

### Candle / Brand Mark

The candle illustration on the login page is the project's signature visual. Two SVG layers:
1. Outer flame: Sage stroke with Sage Subtle interior fill, animated with a subtle flame-flicker on the path.
2. Inner flame: Honey Gold path, slightly off-center, with `feGaussianBlur` filter giving a soft warm halo.

**Do not redesign the candle.** It is the load-bearing piece of brand on the auth surface. Other surfaces (top nav brand mark) use a compressed version of the same two-layer construction.

### Pet Sprite

A composite of artist-sprite shapes layered on `<canvas>` or `<svg>`. Has a soft ground shadow (`shadow-2`) because the pet has physicality. Idle animation: a slow breath cycle, 4-second loop, respects `prefers-reduced-motion` (reduced-motion users see the sprite at rest with no animation; emotional state is conveyed through facial expression and cosmetic only).

## 7. Do's and Don'ts

### Do:
- **Do** use hairline `Rule Line` dividers + whitespace + typography hierarchy to separate sections, not borders + drop shadows.
- **Do** treat the page as one breathing surface on mobile: rows, flow, vertical rhythm. Not a grid of panels.
- **Do** keep numeric stats in the system monospace so 7 and 70 align in the same column.
- **Do** keep the primary sage accent under ~10% of any given screen. Most of the surface is tinted neutral.
- **Do** size every interactive element to at least 44×44px and pad the bottom of the viewport for `env(safe-area-inset-bottom)` so important actions never hide under the Safari toolbar.
- **Do** pad the top of fixed headers for `env(safe-area-inset-top)` so the notch never clips the brand mark or chips.
- **Do** keep horizontal padding on mobile at **20px minimum from the screen edge**. Edge-to-edge content is for desktop only; on a phone it reads as cropped.
- **Do** give every tappable row a visible hover/active background shift (Warm Surface in light, Hover Tint Dark in dark) — touch users see it on `:active`, not just hover.
- **Do** alternate adjacent sections between page background and surface tier when a long page starts to feel like one wall — but try rhythm and a hairline divider first.
- **Do** use 150–200ms ease-out for entrances; ease-in for exits. Match the `cubic-bezier(0.25, 1, 0.5, 1)` curve already in tokens.
- **Do** make completing a habit feel like crossing something off in pen: the checkbox fills sage, the row's text dims to muted, no bounce, no particles.
- **Do** treat dark mode as a peer; both modes should feel equally warm. Tint every neutral toward the brand hue family.
- **Do** prefer skeleton screens over spinners for loading states.

### Don't:
- **Don't** use `#fff` or `#000` or any pure neutral with chroma below `0.005`. Cool office grays kill the well-worn-notebook feel.
- **Don't** use purple gradients or glowing cards. This is the single most identifying AI-tool tell and the user named it twice as a hard veto.
- **Don't** nest cards inside cards. A card containing a smaller card is always wrong in this system.
- **Don't** wrap every section in a card or surface tier. Most things don't need a box. When in doubt, dissolve the box.
- **Don't** use heavy drop shadows as the primary way to show hierarchy. Shadows are for state changes and z-layer separation, not for "this card needs to stand out."
- **Don't** use uppercase labels on navigation, tab bars, or buttons. Normal case with subtle tracking is the project's UI voice.
- **Don't** build a generic icon-label tab bar that looks like every other consumer app. The mobile bottom bar uses custom flame iconography and a sage-dot active state.
- **Don't** use bounce or elastic easing on celebrations. Habit completion is a small "tick", not a spring.
- **Don't** use bottom sheets as the default for every secondary action. Bottom sheets are heavy; prefer inline progressive disclosure or a small popover where possible.
- **Don't** center everything on mobile just because the screen is narrow. Left-align prose. Center only the candle, the pet sprite, and modal CTAs.
- **Don't** put critical actions at the very bottom edge of the viewport without `env(safe-area-inset-bottom)` padding. Safari's bottom toolbar will eat them.
- **Don't** put any important content — primary CTAs, key stats, the streak chip — in the **bottom 80px** of the viewport on mobile. Even with safe-area padding, the browser chrome overlaps that band when it returns from collapse.
- **Don't** put critical context in the top 56px of the page without considering Chrome on Android's collapsing address bar.
- **Don't** drop body text below 15px on mobile (or 14px on desktop), drop numeric stats below 16px, or use opacity below 50% on text the user is meant to read. Demote to `Ash Muted` instead of fading.
- **Don't** truncate a habit name with an ellipsis on mobile. Wrap to a second line.
- **Don't** wrap a single row in its own card just to give it a hover state — the row hover tint does that work without the box.
- **Don't** make Kyndill look like Duolingo (mascot-aggression, streak panic), Habitica (RPG/character-sheet), Notion (corporate database OS), a fitness tracker (ring closures, leaderboards-first), or a todo app (linear checklist as homepage). Each of those is a named anti-reference.
- **Don't** introduce a third typeface. Manrope + Inter + system mono is the entire stack.
- **Don't** decorate. No emoji as visual flourish, no exclamation marks as decoration, no watercolor blobs, no hand-lettered "you are enough" type.
