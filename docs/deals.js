/* ------------------------------------------------------------------
 * Girl Math — deal database (Phase 0: hardcoded)
 *
 * Phase 1 replaces this file's contents with ingestion from affiliate
 * network APIs (Impact, CJ, Rakuten Advertising). Keep the schema:
 *
 * promo: {
 *   id,            // stable id, e.g. "nike:WELCOME10"
 *   kind,          // "code" | "cashback" | "sale"
 *   code,          // the literal code, if kind === "code"
 *   label,         // human-readable, shown in the math panel
 *   valueType,     // "percent" | "fixed"
 *   value,         // number: 10 means 10% or $10
 *   stackable,     // false = cannot combine with other promos
 *   exclusions,    // plain-English caveat, shown in the receipt
 *   expiresAt      // ISO date string
 * }
 *
 * bundlePool entries are complementary products with an active deal.
 * The math engine picks one whose savings help push the original item
 * to $0. In Phase 1 these come from affiliate product feeds filtered
 * by active promos.
 * ------------------------------------------------------------------ */

const GIRL_MATH_DEALS = {
  merchants: {
    amazon: {
      displayName: "Amazon",
      promos: [
        {
          id: "amazon:WELCOME10",
          kind: "code",
          code: "WELCOME10",
          label: "10% off coupon",
          valueType: "percent",
          value: 10,
          stackable: true,
          exclusions: "One code per order",
          expiresAt: "2026-12-31",
        },
        {
          id: "amazon:CASHBACK5",
          kind: "cashback",
          label: "Girl Math cashback",
          valueType: "percent",
          value: 5,
          stackable: true,
          exclusions: "Paid on net price after codes, 60 days",
          expiresAt: "2026-12-31",
        },
      ],
      bundlePool: [
        {
          id: "amazon:bundle:case",
          title: "Phone case",
          price: 45.0,
          dealLabel: "40% off today",
          valueType: "percent",
          value: 40,
        },
        {
          id: "amazon:bundle:cable",
          title: "Braided USB-C cable 2-pack",
          price: 18.0,
          dealLabel: "$6 off coupon",
          valueType: "fixed",
          value: 6,
        },
        {
          id: "amazon:bundle:tablet",
          title: "Refurbished tablet (you've been eyeing it)",
          price: 250.0,
          dealLabel: "45% off refurb sale",
          valueType: "percent",
          value: 45,
        },
      ],
    },

    bestbuy: {
      displayName: "Best Buy",
      promos: [
        {
          id: "bestbuy:STUDENT10",
          kind: "code",
          code: "STUDENT10",
          label: "10% student discount",
          valueType: "percent",
          value: 10,
          stackable: true,
          exclusions: "Verified student account required",
          expiresAt: "2026-12-31",
        },
        {
          id: "bestbuy:CASHBACK8",
          kind: "cashback",
          label: "Girl Math cashback",
          valueType: "percent",
          value: 8,
          stackable: true,
          exclusions: "Paid on net price after codes, 60 days",
          expiresAt: "2026-12-31",
        },
      ],
      bundlePool: [
        {
          id: "bestbuy:bundle:mouse",
          title: "Wireless mouse",
          price: 39.99,
          dealLabel: "Open-box: 30% off",
          valueType: "percent",
          value: 30,
        },
      ],
    },

    target: {
      displayName: "Target",
      promos: [
        {
          id: "target:CIRCLE5",
          kind: "code",
          code: "CIRCLE5",
          label: "5% Circle offer",
          valueType: "percent",
          value: 5,
          stackable: true,
          exclusions: "Target Circle membership, one offer per order",
          expiresAt: "2026-12-31",
        },
        {
          id: "target:CASHBACK6",
          kind: "cashback",
          label: "Girl Math cashback",
          valueType: "percent",
          value: 6,
          stackable: true,
          exclusions: "Paid on net price after codes, 60 days",
          expiresAt: "2026-12-31",
        },
      ],
      bundlePool: [
        {
          id: "target:bundle:candle",
          title: "Scented candle",
          price: 15.0,
          dealLabel: "Buy 2 get 1 free (~33% off)",
          valueType: "percent",
          value: 33,
        },
      ],
    },

    nike: {
      displayName: "Nike",
      promos: [
        {
          id: "nike:MEMBER15",
          kind: "code",
          code: "MEMBER15",
          label: "15% Nike Membership code",
          valueType: "percent",
          value: 15,
          stackable: false,
          exclusions: "Excludes sale items; cannot combine with other codes",
          expiresAt: "2026-12-31",
        },
        {
          id: "nike:CASHBACK10",
          kind: "cashback",
          label: "Girl Math cashback",
          valueType: "percent",
          value: 10,
          stackable: true,
          exclusions: "Paid on net price after codes, 60 days",
          expiresAt: "2026-12-31",
        },
      ],
      bundlePool: [
        {
          id: "nike:bundle:socks",
          title: "Crew socks 3-pack",
          price: 22.0,
          dealLabel: "25% off socks",
          valueType: "percent",
          value: 25,
        },
      ],
    },

    sephora: {
      displayName: "Sephora",
      promos: [
        {
          id: "sephora:BEAUTY20",
          kind: "code",
          code: "BEAUTY20",
          label: "20% off sitewide event",
          valueType: "percent",
          value: 20,
          stackable: true,
          exclusions: "Rouge members; one code per order",
          expiresAt: "2026-12-31",
        },
        {
          id: "sephora:CASHBACK7",
          kind: "cashback",
          label: "Girl Math cashback",
          valueType: "percent",
          value: 7,
          stackable: true,
          exclusions: "Paid on net price after codes, 60 days",
          expiresAt: "2026-12-31",
        },
      ],
      bundlePool: [
        {
          id: "sephora:bundle:mask",
          title: "Sheet mask set",
          price: 28.0,
          dealLabel: "30% off minis",
          valueType: "percent",
          value: 30,
        },
      ],
    },
  },
};

// Hostname -> merchant key. Add retailers here as the rules engine grows.
const GIRL_MATH_HOSTS = {
  "www.amazon.com": "amazon",
  "www.bestbuy.com": "bestbuy",
  "www.target.com": "target",
  "www.nike.com": "nike",
  "www.sephora.com": "sephora",
};
