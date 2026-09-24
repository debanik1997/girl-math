/* ------------------------------------------------------------------
 * Girl Math — content script (Phase 0)
 *
 * Detects product pages on supported retailers, extracts title + price,
 * and hands the product to the background worker (badge) and the popup
 * (via chrome.storage). Selectors are best-effort and WILL rot — in
 * Phase 1 this becomes a per-retailer parser module with fallbacks.
 * ------------------------------------------------------------------ */
(() => {
  "use strict";

  const merchantKey = GIRL_MATH_HOSTS[window.location.hostname];
  if (!merchantKey) return;

  // Retailer-specific selectors, tried in order. Last resort: og: meta tags.
  const SELECTORS = {
    amazon: {
      title: ["#productTitle"],
      price: [
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price .a-offscreen",
        "#corePriceDisplay_desktop_feature_div .a-offscreen",
      ],
    },
    bestbuy: {
      title: ["h1", ".sku-title h1"],
      price: ['[data-testid="customer-price"]', ".priceblock .sr-only"],
    },
    target: {
      title: ['[data-test="product-title"]', "h1"],
      price: ['[data-test="product-price"]'],
    },
    nike: {
      title: ["#pdp_product_title", "h1[data-test='product-title']"],
      price: ['[data-test="product-price"]'],
    },
    sephora: {
      title: ['[data-at="product_name"]', "h1"],
      price: ['[data-at="price"]'],
    },
  };

  function textOf(el) {
    return el ? el.textContent.trim() : "";
  }

  function pick(selectors) {
    for (const s of selectors) {
      const el = document.querySelector(s);
      const t = textOf(el);
      if (t) return t;
    }
    return "";
  }

  function metaPrice() {
    const el = document.querySelector('meta[property="og:price:amount"]');
    return el ? el.getAttribute("content") : "";
  }

  function metaTitle() {
    const el = document.querySelector('meta[property="og:title"]');
    return el ? el.getAttribute("content") : "";
  }

  function parsePrice(raw) {
    if (!raw) return null;
    // Grab the first $-amount-looking token: "$1,299.00" -> 1299.00
    const m = raw.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
    if (!m) return null;
    const v = parseFloat(m[1]);
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  function extract() {
    const sel = SELECTORS[merchantKey] || { title: ["h1"], price: [] };
    const title = pick(sel.title) || metaTitle() || document.title;
    const rawPrice = pick(sel.price) || metaPrice();
    const price = parsePrice(rawPrice);
    if (!price) return null;
    return {
      merchant: merchantKey,
      title: title.slice(0, 120),
      price,
      url: window.location.href.split("?")[0],
      detectedAt: Date.now(),
    };
  }

  function report() {
    const product = extract();
    if (!product) return;
    chrome.storage.local.set({ gm_product: product });
    chrome.runtime.sendMessage({ type: "GM_PRODUCT", product }).catch(() => {});
  }

  // Product pages are often SPAs — re-check a few times after load.
  report();
  let tries = 0;
  const iv = setInterval(() => {
    tries += 1;
    report();
    if (tries >= 4) clearInterval(iv);
  }, 2500);
})();
