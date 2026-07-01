# Open-Source Tools Status

This file tracks the "add them all" request without changing app behavior.

## Added now (npm dependencies)

### UI components
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-popover
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-tabs
- @radix-ui/react-tooltip
- class-variance-authority
- tailwind-merge

### Dashboard cards/tables
- @tanstack/react-table

### Financial charts
- lightweight-charts (already present)

### RSS/news parsing
- rss-parser

### Data caching
- lru-cache
- keyv

### Date/time handling
- date-fns
- date-fns-tz

### Search/filter utilities
- fuse.js
- match-sorter

## Not directly installable as a package in this Next.js app

### SEC filings/fundamentals
- SEC EDGAR public endpoints are HTTP data sources, not an npm package requirement.
- Integration should be added via fetch calls in API routes with proper SEC user-agent and fair-access compliance.

### Ticker universe/search dataset
- FinanceDatabase is primarily a Python dataset/tooling ecosystem.
- In this app, it should be consumed through an offline export/import workflow (CSV/JSON), not a direct runtime npm dependency.

### shadcn/ui
- shadcn/ui is a code generator workflow, not a single runtime package.
- Base compatible dependencies were added (Radix, class-variance-authority, tailwind-merge).
- Optional next step: run the shadcn init command when you want generated component files.

## Notes
- No API keys, env variables, routes, providers, or data logic were changed.
- No paid APIs, paywall bypassing, or scraping additions were introduced.
