# Kyndill — Thesis Defense Prep

Role-specific defense notes for the three team members. Each file follows the same structure:

1. Opening statement (~30 seconds)
2. Technical explanation of key features
3. Likely committee questions + answers
4. Things to point to in the demo
5. Tricky questions to prepare for
6. What NOT to say

## Files

- [`MEMBER_1_BACKEND.md`](MEMBER_1_BACKEND.md) — Backend Engineer & Database Architect (auth, habit completion transaction, streak/freeze mechanics, reward engine, cron, schema)
- [`MEMBER_2_GAMIFICATION.md`](MEMBER_2_GAMIFICATION.md) — Gamification Engineer & Product Designer (pet mechanics, shop/inventory, item drops, focus timer, design system, onboarding)
- [`MEMBER_3_FRONTEND_SOCIAL.md`](MEMBER_3_FRONTEND_SOCIAL.md) — Frontend Engineer & Social Systems Developer (React pages, routing, sockets, friends, gifts, leaderboard, activity, privacy)

## Cross-team handoffs to remember on the day

If a committee question crosses domains (e.g. "how does the level-up notification reach the dashboard?"), Member 1 owns the transaction up to commit, Member 3 owns the socket emit + UI, Member 2 owns the level-up toast/animation. Practice handing the mic.

All three should be able to point to [`docs/DATABASE.md`](../docs/DATABASE.md), [`docs/API.md`](../docs/API.md), and [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). The docs are recent and consistent with the code — citing line numbers ("that's documented at line X of DATABASE.md") signals thoroughness.
