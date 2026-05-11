# Commit convention

Kyndill follows [Conventional Commits](https://www.conventionalcommits.org/) so that history reads as a product narrative, not a stream of "wip" entries.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Subject line: imperative mood, no trailing period, soft limit 72 characters.

## Types

| Type       | Use for                                                                  |
|------------|---------------------------------------------------------------------------|
| `feat`     | A new user-visible feature or capability                                  |
| `fix`      | A bug fix                                                                 |
| `chore`    | Tooling, dependency bumps, repo housekeeping with no behavior change      |
| `docs`     | Documentation only                                                        |
| `style`    | Formatting, whitespace, lint fixes; no logic changes                      |
| `refactor` | Code restructuring with no behavior change                                |

## Scopes

Use the workspace or subsystem the change targets. Examples:

- `frontend`, `backend`, `shared`, `docs`, `infra`
- Finer scopes are welcome: `frontend/pet`, `backend/auth`, `backend/cron`

## Examples

```
feat(backend/auth): issue JWT on successful login

fix(frontend/pet): respect prefers-reduced-motion in idle animation

docs(architecture): document GCP e2-micro deployment topology

chore(deps): bump pg to 8.12
```

## Body and footer

Body explains *why*, not *what*. Reference issues in the footer:

```
Refs: #42
Closes: #17
```
