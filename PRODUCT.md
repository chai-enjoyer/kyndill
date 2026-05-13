# Product

## Users

Students and young professionals, roughly 18-30, who want to build habits without the pressure or shame that many habit apps create. Many have already bounced off streak anxiety or RPG-style productivity mechanics. They often have ADHD, anxiety, or full schedules, and they need a tool that survives missed days rather than punishing them for it. They open the app once or twice a day, usually on a phone, sometimes on a laptop in the morning or evening. The moment is short and the emotional load is already high. Success is "I came back."

## Product Purpose

Kyndill is a habit tracker built around a virtual pet companion. Users add habits, complete small daily check-ins, care for their pet, earn coins, and slowly personalize the companion. The name carries the central metaphor: habits are small flames kept alive daily, not towers built up and demolished when one block slips.

The product exists because aggressive streak design, public pressure, and high-friction gamification can make relapse feel like failure. Kyndill is designed around recoverable progress. Success looks like a person who has lapsed opening the app, finding their pet tired but waiting, reflecting gently, and lighting one habit again.

## Current Product Surface

- Dashboard with today's habits, pet state, streak freezes, XP, coins, activity feed, notifications, and item drops.
- Habit management with daily/weekly schedules, repeated check-ins, time windows, editing, deleting, and drag reorder.
- Onboarding that explains the system and offers starter habits.
- Pet page with name editing, care stats, evolution stage, inventory-backed cosmetics, and sprite composition.
- Shop with consumables, cosmetics, and streak freezes balanced for early progress.
- Friends, friend requests, gifts, friend profiles, and opt-in leaderboards.
- Focus timer with ambient audio, completion rewards, and optional rating.
- Progress insights and recovery reflection for evaluation and long-term adherence.
- Profile/settings with avatar upload, notification preferences, visibility, research consent, and account deletion.

## Brand Personality

Warm, nurturing, grounded. The interface should feel like tending a small flame at the end of the day, not like clocking in to a productivity system. Three words: **tender, steady, considered.**

Voice: second-person, soft but never saccharine. "Take your time" not "You can do it!!" Specific not motivational. "Light one habit today" not "Build your best self." No exclamation marks as decoration. No emoji as decoration.

Emotional goals, in order: safety first, then quiet pride, then gentle continuity. Never urgency, never guilt, never gamified triumph.

## Anti-References

- **Duolingo.** Streak panic, loss aversion, push notifications that escalate. Anything that frames the user as a defector who must be retained.
- **Habitica.** RPG layers, XP bars, gear, classes. Anything that turns daily life into a character sheet.
- **Generic productivity SaaS.** Purple gradients, nested card-on-card layouts, dashboard-shaped home screens, hero metrics with sparklines. The "AI-made-that" aesthetic.
- **Children's apps.** Mascot-forward, bouncy spring animations, cartoon outlines. Kyndill has a pet, but the pet is a companion, not a children's-TV character.
- **Wellness cliche.** Sage-green-and-cream, hand-lettered "you are enough" typography, watercolor blobs. Avoids one cliche only to land in another.

## Design Principles

1. **Tend, don't pressure.** Every interaction is framed as care, not enforcement. The pet is not a hostage; missed days can make it tired, but the language and recovery flow focus on returning, adjusting, and caring.

2. **Recoverable, not catastrophic.** A missed day is a quiet welcome back, not a guilt screen. The system should be impossible to "fail" in a single visit. Users who return after a gap find a clear next step and a soft recovery reflection.

3. **Private by default, social by invitation.** Social features are opt-in, scoped to small chosen circles, and supportive in tone. The global leaderboard is opt-in through public visibility; private users stay out of public ranking surfaces.

4. **Small flames, not bonfires.** Reward the small, repeated, almost-invisible act of showing up. The interface should make one completed habit feel meaningful without requiring a huge streak to feel progress.

5. **Companion, not mascot.** The pet has emotional state that reflects consistency and care, but it does not beg, threaten, or perform. It is a quiet presence, not a hype character.

## Accessibility And Inclusion

Baseline: **WCAG 2.1 AA.** Contrast AA against tinted neutrals, full keyboard navigation, visible focus rings, screen-reader labels on interactive elements, and touch targets sized for mobile use.

Motion: respect `prefers-reduced-motion` in every animation, including flames, page transitions, and pet idle states. Reduced-motion users should still get full emotional signaling from color, state, copy, and layout.

Tone accommodation: language should not assume neurotypical productivity patterns. Avoid "fell off," "broke your streak," and "you failed today." Test copy against the standard: would this make a user with anxiety or ADHD feel worse on their worst day? If yes, rewrite it.

Asset note: pet shapes, faces, and cosmetics are stackable artist sprites where available. Consumables and system icons use app-native SVG assets. Any remaining placeholders should use the standard comment format: `// PLACEHOLDER: Replace with [specific artist asset] when delivered`.
