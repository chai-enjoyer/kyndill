# Fonts

Self-hosted variable woff2 files for the Kyndill type system. Inter carries body and UI text; Manrope carries display headings and brand-visible labels.

| File                          | Family             | License                  | Source                                              |
| ----------------------------- | ------------------ | ------------------------ | --------------------------------------------------- |
| `inter-variable.woff2`        | Inter, roman       | SIL Open Font License 1.1 | https://rsms.me/inter/                              |
| `inter-variable-italic.woff2` | Inter, italic      | SIL Open Font License 1.1 | https://rsms.me/inter/                              |
| `manrope-variable.woff2`      | Manrope            | SIL Open Font License 1.1 | https://github.com/sharanda/manrope                 |

All three families are distributed under the SIL Open Font License and may be redistributed with this project.

## Refreshing the files

The setup script downloads stable variable builds from the `@fontsource-variable` packages on jsDelivr:

```powershell
$dest = "$PSScriptRoot"
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"  -OutFile "$dest\inter-variable.woff2"
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2" -OutFile "$dest\inter-variable-italic.woff2"
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2" -OutFile "$dest\manrope-variable.woff2"
```

If the files are missing, the type system gracefully falls back to the system-font stack declared in `tokens.css`.
