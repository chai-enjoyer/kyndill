# Product

## Register

product

## Users

Students and young professionals, roughly 18–30, who want to build habits without the pressure or shame that most habit apps inflict. Many have already bounced off Duolingo-style streak anxiety or Habitica-style RPG mechanics. They often have ADHD, anxiety, or just full lives, and they need a tool that survives missed days rather than punishing them for it. They open the app once or twice a day, usually on a phone, sometimes on a laptop in the morning or evening; the moment is short and the emotional load is already high. Success is "I came back."

## Product Purpose

Kyndill (Old Norse for candle, a small torch) is a habit tracker built around a virtual pet companion. Users add a small set of habits; completing them keeps the pet healthy; the pet's emotional state reflects their consistency. The name carries the whole metaphor: habits are small flames kept alive daily, not towers built up and demolished when one block slips.

The product exists because the dominant habit-app design language, aggressive streaks, public leaderboards, RPG progression, treats relapse as failure. That works for some users and breaks others. Kyndill is for the users it breaks. Success looks like a person who has lapsed for a week opening the app, finding their pet quietly waiting, lighting one habit, and feeling welcomed back instead of judged.

## Brand Personality

Warm, nurturing, grounded. The interface should feel like tending a small flame at the end of the day, not like clocking in to a productivity system. Three words: **tender, steady, considered.**

Voice: second-person, soft but never saccharine. "Take your time" not "You can do it!!" Specific not motivational. "Light one habit today" not "Build your best self." No exclamation marks as decoration. No emoji as decoration.

Emotional goals, in order: safety first, then quiet pride, then gentle continuity. Never urgency, never guilt, never gamified triumph.

## Anti-references

- **Duolingo.** Streak panic, loss aversion, push notifications that escalate. Anything that frames the user as a defector who must be retained.
- **Habitica.** RPG layers, XP bars, gear, classes. Anything that turns daily life into a character sheet.
- **Generic productivity SaaS.** Purple gradients, Inter font as default, nested card-on-card layouts, dashboard-shaped home screens, hero metrics with sparklines. The "AI-made-that" aesthetic.
- **Children's apps.** Mascot-forward, bouncy spring animations, cartoon outlines. Kyndill has a pet, but the pet is a companion, not a children's-TV character.
- **Wellness aesthetic.** Sage-green-and-cream, hand-lettered "you are enough" typography, watercolor blobs. Avoids one cliché only to land in another.

## Design Principles

1. **Tend, don't pressure.** Every interaction is framed as care, not enforcement. The pet is not a hostage; missing a day does not "hurt" it. Streaks are de-emphasized in favor of recoverable continuity.

2. **Recoverable, not catastrophic.** A missed day is a quiet welcome back, not a counter reset and a guilt screen. The system should be impossible to "fail" in a single visit; users who return after a gap find the pet tired but waiting, with a soft prompt to relight one habit.

3. **Private by default, social by invitation.** No public leaderboards. No friend feeds out of the box. Social features are opt-in, scoped to small chosen circles, and supportive in tone. The default account is a solo account.

4. **Small flames, not bonfires.** Reward the small, repeated, almost-invisible act of showing up. The interface should make one completed habit feel meaningful, not require streaks or stacks to feel like progress.

5. **Companion, not mascot.** The pet has emotional state that reflects the user's consistency, but it does not narrate, beg, or perform. It is a quiet presence, not a hype character. Placeholder pet art lives behind a clean component boundary so the eventual real art can drop in without redesign.

## Accessibility & Inclusion

Baseline: **WCAG 2.1 AA.** Contrast AA against tinted neutrals (no `#000`/`#fff`), full keyboard navigation, visible focus rings, screen-reader labels on every interactive element including the pet.

Motion: **respect `prefers-reduced-motion`** in every animation, including the pet's idle states. Reduced-motion users should still get full emotional signaling from the pet, expressed through color and pose rather than motion.

Tone accommodation: language should not assume neurotypical productivity patterns. Avoid "fell off," "broke your streak," "you failed today." Test copy against the standard: would this make a user with anxiety or ADHD feel worse on their worst day? If yes, rewrite it.

Asset note: pet, item, and cosmetic art are placeholders (simple colored SVG shapes) until the artist delivers. The visual system must look intentional with placeholders, not "waiting for the real thing."
