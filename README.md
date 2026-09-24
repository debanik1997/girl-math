# girl math 🧮

A quiet layer on top of checkout: when you're about to buy something, it finds
a stack of deals, coupons, and cashback — plus one optional bundle item — whose
combined savings cover the original item's price. Buy two things, the first one
is free*. (*girl math)

## Phase 0 — Chrome extension prototype

A Manifest V3 extension with **hardcoded deal data**. It proves the UX loop:

1. Open a product page (Amazon, Best Buy, Target, Nike, Sephora).
2. The toolbar badge lights up (`GM`) when a product is detected.
3. Click it: the popup shows the item, applies the best promo code + cashback,
   and offers bundle items whose deal savings push the original item toward $0.
4. The receipt screen shows the full math — built to be screenshotted —
   with a copy-to-clipboard button.

### The math

```
totalSavings = bestCode + bestCashback(on net price) + bundleDealSavings
girlPrice    = max(0, itemPrice - totalSavings)   →  $0  =  FREE*
```

Stacking policy is deliberately realistic: one promo code per order (best wins),
one cashback portal (best rate, on net price), one bundle item. The per-retailer
rules table in Phase 1 replaces these defaults.

### Try it

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select `extension/`.
2. Open any product page on a supported retailer.
3. Click the 🧮 toolbar icon.

### Run the tests

```bash
cd extension/test && npm install && npm test
```

20 assertions cover the math engine against the real popup DOM (jsdom):
deal-only pricing, the FREE path via bundle, empty state, and non-stackable
code handling.

### File map

```
extension/
  manifest.json        MV3 manifest
  icons/               app icon (PNG 128)
  src/
    deals.js           hardcoded deal DB — the schema Phase 1's API ingestion fills
    content.js         product detection + price extraction (retailer selectors)
    background.js      toolbar badge (Phase 1: affiliate-link routing lives here)
    popup.html/.css/.js  the math panel UI + girl-math engine
  test/                jsdom functional tests for the popup
```

### What's stubbed (on purpose)

- Deal data is hardcoded in `src/deals.js` — no network calls at all.
- "Apply code" and cashback routing are display-only; nothing touches checkout.
- Price selectors are best-effort and will rot; the content script falls back to
  `og:price:amount` / `og:title` meta tags.

## Roadmap

- **Phase 1** — real data: affiliate network APIs (Impact, CJ, Rakuten
  Advertising) → normalize into the `deals.js` schema; per-retailer stacking
  rules table; affiliate-link routing for cashback in `background.js`.
- **Phase 2** — community codes + background code auto-testing (the Honey trick);
  bundle suggestions from affiliate product feeds.
- **Phase 3** — mobile: iOS Safari web extension port; share-sheet flow for
  in-app checkout.

## Name note

"Girl math" is a widely used meme phrase, but check USPTO/trademark before
anything public or commercial.
