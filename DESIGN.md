# Design tokens (MFO Agency)

## Surface levels

| Level | Class | Use |
|-------|--------|-----|
| **Hero** | `surface-glow` + `surface-glow-hero` | Agent dashboard: main income |
| **Metric** | `surface-glow` + `surface-glow-metric-a` / `-b` | Sales, conversion, income accrual cards |
| **Flat** | `surface-flat` | Period, lists, charts, manager/admin |

Gradient animation applies only to **hero** and **metric** surfaces.

Flat surfaces and lists use **glass** (`backdrop-filter` + translucent fill).

Page background: fixed `body::before` (wash + noise) + orbiting `body::after` (accent, success, warning). Chrome: floating **glass-dock** tab bar and **glass-bar** header (iOS-style); agent header uses **glass-bar-soft** (no bottom border).

## Semantic colors

- **accent** — funnel in progress, links, primary actions
- **success** — approved, sale, paid, confirm actions (manager)
- **warning** — under review, accrued (not paid)
- **danger** — rejected

## Motion

- `prefers-reduced-motion`: disable gradient drift, shimmer, page enters
- Period change: skeleton only on hero + 2 metric cards; progress and period stay visible
