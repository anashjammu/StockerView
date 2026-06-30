# API Setup

## Financial Modeling Prep

Set `FMP_API_KEY` in `.env.local` for server-side Financial Modeling Prep requests.

```env
FMP_API_KEY=your_key_here
```

## Yahoo Finance Futures Fallback

Yahoo Finance is used as a no-key best-effort fallback for delayed futures-style data. It is unofficial and may be unavailable or unsuitable for production redistribution.

Enable it with:

```env
YAHOO_FINANCE_ENABLED=true
```
