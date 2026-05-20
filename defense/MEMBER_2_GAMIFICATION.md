# Member 2 — Gamification Engineer & Product Designer

**Owns:** Virtual pet mechanics (stats/fainting/recovery/evolution), shop and inventory, item drop algorithm + rarity tiers, focus timer, design system (CSS tokens/light/dark mode), onboarding flow. **Thesis sections:** literature review gamification parts (1.1.3), system analysis (1.2), requirements derivation (1.2.7).

---

## 1. Opening statement (~30 seconds)

> "I designed and built the gamification surface — the virtual pet's stats and lifecycle, the shop and inventory, the item drop algorithm with rarity tiers, the focus timer, and the design system that ties the whole app together: the design tokens, light/dark mode, and the onboarding flow. The thesis problem statement is that habit trackers tend to either gamify into addictiveness or fail to motivate at all. My job was to find the middle: a companion the user cares about without punishing them when life happens. That's why the pet has passive decay but also auto-revives, why drops feel rewarding but plateau, and why onboarding asks for explicit consent before we record anything."

---

## 2. Key features — explained

### A. Virtual pet mechanics
**File:** [backend/src/services/petService.ts](../backend/src/services/petService.ts)

- **What it does.** Every user has one pet with 5 stats (health, happiness, hunger, energy, cleanliness, 0–100), an evolution stage (1–3), a fainted flag, and equipped cosmetics in 6 slots.
- **How it works.** Three writeback paths feed the pet:
  - `applyHabitCompletionEffects(category)` — fires on every habit completion. Per-category deltas (Health, Productivity, Social, Learning, Wellness) move different stats; e.g. Social adds +12 happiness and -6 hunger, Wellness keeps energy/cleanliness neutral. Stats are clamped to `[0,100]`.
  - `applyPassiveDecay()` — fires on every pet *read*. Time elapsed since `last_decay_at` (capped at 7 days) drops hunger -6/d, energy -5/d, cleanliness -4/d, happiness -3/d.
  - The cron + completion flows call `derivePetHealth(streak, stats)` = `careAvg × 0.55 + min(100, streak × 12) × 0.35 + min(12, streak × 2)`.
  - **Faint trigger:** `hunger ≤ 0 OR energy ≤ 0 OR health ≤ 0`. **Revive trigger:** `health ≥ 25` (auto-revive after the user feeds it).
- **Why this design.** Capping decay at 7 days means a user returning after a long absence finds a hungry pet, not a dead one — recoverable. The faint state is reachable but only via *both* care neglect *and* low streak; either one alone is survivable.

### B. Shop and inventory
**Files:** [backend/src/services/shopService.ts](../backend/src/services/shopService.ts), [backend/src/services/inventoryService.ts](../backend/src/services/inventoryService.ts), [011_seed_items.sql](../backend/db/migrations/011_seed_items.sql), [017_sprite_backed_cosmetic_catalog.sql](../backend/db/migrations/017_sprite_backed_cosmetic_catalog.sql)

- **What it does.** Catalog of cosmetics (slot-equippable), consumables (single-use stat boosts), and a special streak-freeze line. User spends coins to buy.
- **How it works.** `GET /api/shop` returns coins, freeze count, and items grouped by type. Cosmetics include `owned: boolean` flag so the UI hides duplicates. `POST /api/shop/purchase` deducts coins inside a transaction, inserts/updates `inventory(user_id, item_id, quantity)`. Buying a streak freeze increments `streaks.freeze_count` up to a hard cap of 3 at 35 coins each. Errors are explicit codes: `INSUFFICIENT_COINS`, `ALREADY_OWNED`, `FREEZE_LIMIT_REACHED`.
- **Why this design.** Cosmetics are one-per-user (no resale, no economy abuse), consumables are quantified. Migrations [018_balance_and_remove_background_cosmetics.sql](../backend/db/migrations/018_balance_and_remove_background_cosmetics.sql) and [020_accessible_shop_economy.sql](../backend/db/migrations/020_accessible_shop_economy.sql) explicitly tuned prices so a casual user can afford something within the first week — that's the "accessibility" half of the design principle.

### C. Item drop algorithm + rarity tiers
**File:** [backend/src/services/rewardService.ts](../backend/src/services/rewardService.ts)

- **What it does.** On a successful habit completion, rolls a possible item drop tilted by current streak and habit category.
- **How it works.** Drop chance = `0.34 + 0.04 (streak≥3) + 0.04 (≥7) + 0.05 (≥14) + 0.05 (≥30)`, capping at 52%. If it drops, rarity is a single roll: `<0.62` common consumable, `<0.80` rare consumable, `<0.93` common cosmetic, `<0.985` rare cosmetic, else legendary cosmetic. Consumables prefer category-appropriate items (Health → Apple/Carrot/Water, Wellness → Soap, etc.). Cosmetic drops exclude already-owned items so legendary feels singular.
- **Why this design.** Variable-ratio reinforcement is the well-studied mechanic behind engagement. The cap (at streak 30) is deliberate: we wanted *diminishing* novelty rather than escalating reinforcement, because the literature in section 1.1.3 flags unbounded variable-ratio schedules as the addiction concern.
- **Thesis tie-in.** Section 1.1.3 (gamification literature review) sets up the Skinner-box critique; this algorithm is the implemented counter-argument.

### D. Focus timer
**Files:** [backend/src/services/focusService.ts](../backend/src/services/focusService.ts), [frontend/src/pages/FocusPage.tsx](../frontend/src/pages/FocusPage.tsx)

- **What it does.** Pomodoro-style timer (1–120 minutes), with ambient sound options (rain, forest, night, brown noise), completion chime, and a coin reward scaled by duration.
- **How it works.** Server-side `complete(duration, rating?)` validates the duration range, computes `coinsEarned = min(36, max(4, round(duration/3)))`, inserts a `focus_sessions` row, and credits the user's coins inside a transaction. Rating can be added later via `PATCH /focus/:id/rating`. Frontend handles the timer locally and the ambient loops from [frontend/public/ambient/](../frontend/public/ambient/).
- **Why this design.** The reward scales linearly but caps at 36 coins to prevent "set a 5-hour timer and walk away" abuse. The optional rating gives us the evaluation data point in 3.4 without forcing it on users.

### E. Design system — tokens, light/dark
**Files:** [frontend/src/styles/tokens.css](../frontend/src/styles/tokens.css), [components.css](../frontend/src/styles/components.css), [global.css](../frontend/src/styles/global.css)

- **What it does.** Centralized design tokens drive every color, space, radius, shadow, and typography decision across the app. One toggle flips the entire UI between light and dark.
- **How it works.** `tokens.css` defines `:root` variables and a `:root.dark, :root[data-theme='dark']` override. Color tokens use the OKLCH color space (perceptually uniform — equal L values look equally bright across hues). A restrained palette: warm neutral surfaces + one ember accent + sage/honey reserved for brand surfaces. Category colors get their own role tokens (`--color-category-health` etc.) so habit pills stay visually distinct. Tap target minimum is set at 44px to honor mobile accessibility guidance.
- **Why this design.** Putting every visual decision behind tokens means a dark-mode bug becomes a single-variable fix, not a per-component override. OKLCH was chosen specifically because HSL has known perceptual issues (yellow at 50% lightness looks brighter than blue at 50%).

### F. Onboarding flow
**Files:** [frontend/src/pages/OnboardingPage.tsx](../frontend/src/pages/OnboardingPage.tsx), `POST /api/pet/initialize`

- **What it does.** 5-step first-run experience: consent → tour → species → name → starter habits.
- **How it works.** Frontend gates state per step. On finish, it `POST /api/pet/initialize` (sets species/name and `initialized_at`), `PATCH /api/user/profile` for `research_consent`, and creates each selected starter habit via `POST /api/habits`. The onboarding redirect (`RequireAuth` in [App.tsx](../frontend/src/App.tsx)) keys off `pets.initialized_at IS NOT NULL`.
- **Why this design.** Explicit research consent is collected up front to support the thesis evaluation. Starter habits give the user a populated dashboard on day one — empty-state friction was the single biggest drop-off we anticipated.

---

## 3. Likely committee questions + answers

**Q1. How is your gamification different from a game like Habitica?**
Habitica is RPG-style with HP loss as punishment for missed habits. Kyndill is companion-style: the pet's discomfort is information, not punishment. We never "kill" the pet — fainting auto-reverses on care, and there's no permanent loss. The thesis problem statement (recoverable rather than punitive) is the direct driver.

**Q2. Why a star/cube/sphere/pyramid pet instead of an animal?**
Two reasons. Abstract shapes sidestep the "is this a child-targeted game" perception, which mattered for a research-consent-bearing study. And visually, sprite-based shapes meant we could ship cosmetics for every species without painting unique art per animal.

**Q3. Walk me through the math on item drop chance.**
Base 34%, then +4% at streak 3, +4% at 7, +5% at 14, +5% at 30. So a brand-new user hits 34% per completion; someone with a 30+ streak hits 52%. The increases plateau intentionally — there's no further increase past 30 days. Rarity is a separate uniform roll once a drop fires; legendary is 1.5% of drops, so an effective rate of roughly 0.8% per completion for a long-streak user.

**Q4. Why cap streak bonuses?**
To keep the late-game from running away. If XP and drop chance both scaled unboundedly with streak, a 200-day user would be drowning in coins and items, which (a) breaks the shop economy and (b) reinforces the variable-ratio addiction loop we explicitly didn't want. The literature in 1.1.3 supports this — Hamari et al.'s meta-analysis of gamification effectiveness notes diminishing returns is a healthier curve.

**Q5. Why OKLCH for colors instead of HEX or HSL?**
Perceptual uniformity. In HSL, a value of `hsl(60, 80%, 50%)` (yellow) looks much brighter than `hsl(240, 80%, 50%)` (blue), even though L is the same. In OKLCH, the L channel is calibrated to human perception, so when I change a hue I don't have to manually re-balance lightness. It's also the only space where you can reason about contrast ratios numerically.

**Q6. What is the pet's "consistency bonus" doing in the health formula?**
It's a small additive term capped at +12. Its role is to give a low-streak user with bad care stats a faint *boost* from any momentum at all, so health doesn't sit at near-zero when they've just started. Without it, the formula would punish day-1 users for nothing they did wrong.

**Q7. How did you decide the consumable category mappings?**
We mapped them thematically: Health habits drop fruit/water, Productivity drops coffee/bread, Social drops the toy ball (the most "playful" item), Learning mirrors Productivity, Wellness drops water/soap/toy. The mapping is in `rewardService.ts` around line 67. It's not load-bearing for the thesis; it's flavor.

**Q8. How is your design system tested?**
The tokens are the test surface: if a token changes, every component using it updates. Light/dark mode flips by toggling `[data-theme='dark']` on `:root` — I tested every page in both modes manually. There's no automated visual regression yet; that's a known limitation we'd want before a real release.

**Q9. Why ask for research consent on the very first screen?**
Two reasons. First, the consent has to be informed and pre-collection — collecting evaluation data without prior consent is an ethics violation for a thesis. Second, putting it up front means users who decline never have their data logged, even by accident; `research_consent` defaults to false in the schema.

**Q10. What's the limitation of your part?**
The pet has no sound or animation states beyond static sprites; the focus timer's ambient audio loops have small clicks at loop boundaries; and the shop has no sort/filter — it's a flat list. None of these affect the thesis claim, but they would be the first polish targets in a real release.

---

## 4. Things to point to in the demo

- **[backend/src/services/petService.ts](../backend/src/services/petService.ts) — `applyPassiveDecay()`** — show the formula and the 7-day cap: "passive decay is bounded, so a user returning after a long trip finds a sad pet, not a dead one."
- **[backend/src/services/petService.ts](../backend/src/services/petService.ts) — `derivePetHealth()`** — "55% care stats, 35% streak momentum, plus a small consistency bonus — health is *derived*, not stored independently."
- **[backend/src/services/rewardService.ts](../backend/src/services/rewardService.ts) — `rollDrop()`** — read the probability table out loud; it's only 20 lines and tells the whole story.
- **[018_balance_and_remove_background_cosmetics.sql](../backend/db/migrations/018_balance_and_remove_background_cosmetics.sql) and [020_accessible_shop_economy.sql](../backend/db/migrations/020_accessible_shop_economy.sql)** — "the economy was tuned twice based on internal playtests."
- **[frontend/src/styles/tokens.css](../frontend/src/styles/tokens.css)** — scroll the file; "every visual decision in the app is one of these variables."
- **[frontend/src/pages/OnboardingPage.tsx](../frontend/src/pages/OnboardingPage.tsx)** — walk through the 5 steps live in the browser.
- **[frontend/src/pages/FocusPage.tsx](../frontend/src/pages/FocusPage.tsx)** — start a 1-minute focus session live, let the chime play, show the coin reward.

---

## 5. Tricky questions to prepare for

- **"Isn't variable-ratio reinforcement exactly what slot machines use?"** Yes — and that's why we capped it and bounded the rarity curve. The literature in 1.1.3 distinguishes between *unbounded* variable-ratio (slot machines) and *bounded with diminishing returns* (well-designed games). Our implementation falls firmly in the second.
- **"Your pet can't actually die. Doesn't that remove the stakes?"** Permanent loss isn't motivation, it's gating. The motivation here is *care* — the pet shows distress, the user responds, the relationship continues. The thesis explicitly argues against punitive design.
- **"You measured the literature claims about gamification but did you measure your own?"** Section 3.4 (evaluation) reports our limited user study. We acknowledge the sample is small; the contribution is the design and the data collection method, not a statistically significant effect.
- **"OKLCH isn't supported everywhere."** It's supported in every evergreen browser since 2023. Our target audience is web users on modern browsers; we explicitly don't support IE or pre-2023 Safari. If we did, the tokens would fall back through a build-time conversion to `lab()` or `rgb()`.
- **"Why coins instead of a currency that already exists in the player's life?"** Real-money tie-ins were never on the table — they would have compromised the research ethics. Coins are intra-app and have no exchange value.

---

## 6. What NOT to say

- Don't call the pet "addictive" — even casually. The design thesis is explicitly anti-addiction.
- Don't claim the design system is "fully accessible" — claim "WCAG-AA-targeted with reduced-motion and 44px tap targets." Be specific about what you tested.
- Don't oversell user-testing — say exactly how many users participated and what the limitation is.
- Don't say "I picked OKLCH because it's modern" — say "I picked it because of perceptual uniformity for predictable dark-mode mirroring."
- Don't apologize for the abstract pet shapes. Defend them: deliberate design choice with research-ethics and asset-economy justifications.
