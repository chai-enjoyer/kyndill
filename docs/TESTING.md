# Testing

Kyndill uses a layered test setup:

- **Backend unit/API tests:** Vitest + Supertest.
- **Frontend unit/component tests:** Vitest + Testing Library + jsdom.
- **End-to-end browser tests:** Playwright.
- **Visual reports:** Playwright HTML reports, exported screenshots, and Vitest HTML coverage.
- **Optional cloud device coverage:** BrowserStack running the Playwright suite later.

## Install Browser Binaries

After installing dependencies, install Playwright browsers once:

```bash
npm run test:e2e:install
```

This downloads Chromium, Firefox, and WebKit for local E2E testing.

## Commands

Run backend tests:

```bash
npm run test --workspace backend
```

Run frontend tests:

```bash
npm run test --workspace frontend
```

Run unit/API/component tests together:

```bash
npm run test:unit
```

Run browser E2E tests:

```bash
npm run test:e2e
```

Run frontend and backend unit tests with HTML coverage:

```bash
npm run test:coverage
```

Run everything:

```bash
npm test
```

Open the Playwright UI runner:

```bash
npm run test:e2e:ui
```

Open the latest Playwright HTML report:

```bash
npm run test:e2e:report
```

## Test Reports

Test runs generate machine-readable reports under `reports/`:

- `reports/backend-unit.xml`
- `reports/frontend-unit.xml`
- `reports/e2e-junit.xml`

Coverage runs generate visual HTML coverage reports:

- `coverage/backend/index.html`
- `coverage/frontend/index.html`

Playwright generates an HTML report under `playwright-report/` after E2E runs. The authenticated page tests attach screenshots to that report and export presentation-friendly PNGs into:

- `reports/screenshots/`

Playwright traces and temporary run metadata live under `test-results/`. `coverage/`, `reports/`, `test-results/`, and `playwright-report/` are ignored by git.

## Current Coverage

Backend/API:

- email/password validation helpers
- pet health derivation
- auth route validation for weak registration payloads
- protected route authentication boundaries
- request validation for habits, pet, shop, focus, social, profile, feedback, recovery, and account deletion
- health endpoint readiness response

Frontend:

- email/password validation helpers
- password requirements component
- habit template conversion and repeatable habit metadata
- date, notification, image fallback, and pet-health utility helpers
- accessible stat explanation tooltip wiring

E2E/browser:

- unauthenticated registration and login/register tab behavior
- authenticated dashboard, progress, habits, pet, shop, friends, leaderboard, focus, profile, and settings pages with mocked production-like API data
- dashboard repeated-habit completion, feedback prompt, and item-drop evidence
- friend profile, add-friend modal, and privacy check
- mobile bottom navigation including shop and profile/sign-out access

## Thesis/Presentation Artifacts

For demo screenshots, run:

```bash
npm run test:e2e
```

Then use:

- `playwright-report/index.html` for a navigable visual report with screenshots attached per test
- `reports/screenshots/*.png` for standalone slide images
- `coverage/backend/index.html` and `coverage/frontend/index.html` after `npm run test:coverage` for coverage screenshots

These artifacts are local build outputs and should not be committed.

## Useful Next Tests

- database-backed integration tests with a disposable PostgreSQL database
- mocked Google OAuth token verification
- full happy-path onboarding through real backend routes
- shop purchase/equip flow through real backend routes
- focus completion with timer controls shortened for test mode

## BrowserStack Later

Do not start with BrowserStack for every test. First keep the suite fast locally and in CI with Playwright. Add BrowserStack after the flows stabilize, using a smaller critical path suite:

- registration/login smoke
- onboarding
- dashboard completion
- mobile navigation
- shop purchase/equip
- focus completion

BrowserStack is best for real iPhone Safari, Android Chrome, and desktop browser confidence before demo or deployment.
