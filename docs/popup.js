/* ------------------------------------------------------------------
 * Girl Math — popup math engine + UI (Phase 0)
 *
 * Girl-math rule: totalSavings = code + cashback + bundleDealSavings.
 * girlPrice = max(0, itemPrice - totalSavings). If it hits 0, the item
 * is FREE* (*you still bought the bundle — that's the joke).
 *
 * Stacking policy (Phase 0, realistic defaults):
 *  - one promo code per order (the best one wins)
 *  - one cashback portal per order (the best rate wins, on net price)
 *  - one bundle item (radio select)
 * Phase 1 replaces this with the per-retailer rules table.
 * ------------------------------------------------------------------ */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const money = (n) => "$" + n.toFixed(2);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  function savingOf(promo, price) {
    if (promo.valueType === "percent") return (price * promo.value) / 100;
    return Math.min(promo.value, price);
  }

  function livePromos(merchantDeals) {
    const now = new Date();
    return merchantDeals.promos.filter((p) => new Date(p.expiresAt) >= now);
  }

  function compute(product, md, bundleId) {
    const promos = livePromos(md);

    // Best single code (one code per order — realistic).
    const codes = promos
      .filter((p) => p.kind === "code")
      .sort((a, b) => savingOf(b, product.price) - savingOf(a, product.price));
    const code = codes[0] || null;
    const codeSaving = code ? savingOf(code, product.price) : 0;

    // Best cashback rate, applied to net price after the code.
    const net = product.price - codeSaving;
    const cashbacks = promos
      .filter((p) => p.kind === "cashback")
      .sort((a, b) => b.value - a.value);
    const cashback = cashbacks[0] || null;
    const cashbackSaving = cashback ? (net * cashback.value) / 100 : 0;

    // Optional bundle item.
    const bundle = bundleId
      ? md.bundlePool.find((b) => b.id === bundleId) || null
      : null;
    const bundleSaving = bundle ? savingOf(bundle, bundle.price) : 0;
    const bundleCost = bundle ? bundle.price - bundleSaving : 0;

    const totalSaving = codeSaving + cashbackSaving + bundleSaving;
    const girlPrice = Math.max(0, product.price - totalSaving);
    const outOfPocket = girlPrice + bundleCost;
    const itemCount = bundle ? 2 : 1;

    const lines = [];
    if (code)
      lines.push({
        kind: "code",
        chip: "promo",
        label: code.label,
        sub: code.exclusions || `apply ${code.code}`,
        amount: codeSaving,
        note: code.exclusions,
      });
    if (cashback)
      lines.push({
        kind: "cashback",
        chip: "cashback",
        label: cashback.label,
        sub: cashback.exclusions || "via cashback portal",
        amount: cashbackSaving,
        note: cashback.exclusions,
      });
    if (bundle)
      lines.push({
        kind: "bundle",
        chip: "bundle",
        label: `Bundle: ${bundle.title}`,
        sub: `${bundle.dealLabel} · you pay ${money(bundleCost)}`,
        amount: bundleSaving,
        note: `You pay ${money(bundleCost)} for it`,
      });

    return {
      code,
      cashback,
      bundle,
      lines,
      totalSaving,
      girlPrice,
      outOfPocket,
      itemCount,
      isFree: girlPrice === 0,
    };
  }

  function receiptText(product, md, r) {
    const L = [];
    L.push("🧮 GIRL MATH RECEIPT");
    L.push(`${product.title} — ${money(product.price)} (${md.displayName})`);
    L.push("------------------------------");
    for (const ln of r.lines) L.push(`- ${ln.label}: -${money(ln.amount)}`);
    L.push("------------------------------");
    L.push(`Total savings: ${money(r.totalSaving)}`);
    if (r.isFree) {
      L.push(`Girl math price: $0.00 — IT'S FREE*`);
      L.push(`*you bought ${r.itemCount} things and paid ${money(r.outOfPocket)}`);
    } else {
      L.push(`Girl math price: ${money(r.girlPrice)}`);
      L.push(`Out of pocket (${r.itemCount} items): ${money(r.outOfPocket)}`);
    }
    return L.join("\n");
  }

  function render(product) {
    const md = GIRL_MATH_DEALS.merchants[product.merchant];
    if (!md) {
      $("empty").hidden = false;
      return;
    }
    $("empty").hidden = true;
    $("main").hidden = false;

    $("p-title").textContent = product.title;
    $("p-merchant").textContent = md.displayName;
    $("p-price").textContent = money(product.price);

    // Bundle radio list (rebuilt each render; keeps selection).
    const bundlesEl = $("bundles");
    const prevSel = document.querySelector('input[name="bundle"]:checked');
    const prevId = prevSel ? prevSel.value : "";
    bundlesEl.innerHTML = "";
    const none = document.createElement("label");
    none.className = "bundle-row";
    none.innerHTML = `<input type="radio" name="bundle" value="" ${
      !prevId ? "checked" : ""
    } /> <span>no bundle — just the deals</span>`;
    bundlesEl.appendChild(none);
    for (const b of md.bundlePool) {
      const s = savingOf(b, b.price);
      const row = document.createElement("label");
      row.className = "bundle-row";
      row.innerHTML =
        `<input type="radio" name="bundle" value="${b.id}" ${
          prevId === b.id ? "checked" : ""
        } /> ` +
        `<span><strong>${b.title}</strong> — ${money(b.price)}<br/>` +
        `<span class="muted">${b.dealLabel} (saves ${money(s)})</span></span>`;
      bundlesEl.appendChild(row);
    }
    bundlesEl.onchange = () => render(product);

    const sel = document.querySelector('input[name="bundle"]:checked');
    const r = compute(product, md, sel && sel.value ? sel.value : null);

    const linesEl = $("lines");
    linesEl.innerHTML = "";
    const base = document.createElement("div");
    base.className = "line";
    base.innerHTML = `<span class="chip base">list price</span>
      <span class="desc"><span class="main">${esc(
        product.title.slice(0, 40)
      )}</span></span>
      <span class="num">${money(product.price)}</span>`;
    linesEl.appendChild(base);
    for (const ln of r.lines) {
      const d = document.createElement("div");
      d.className = "line saving";
      d.innerHTML = `<span class="chip ${ln.kind}">${ln.chip}</span>
        <span class="desc"><span class="main">${esc(ln.label)}</span>${
        ln.sub ? `<span class="sub">${esc(ln.sub)}</span>` : ""
      }</span>
        <span class="num">−${money(ln.amount)}</span>`;
      linesEl.appendChild(d);
    }
    const tot = document.createElement("div");
    tot.className = "line total";
    tot.innerHTML = `<span>Total savings</span><span class="num">−${money(
      r.totalSaving
    )}</span>`;
    linesEl.appendChild(tot);

    if (r.isFree) {
      $("r-label").textContent = "girl math price";
      $("r-price").textContent = "FREE*";
      $("r-price").classList.add("free");
      $("r-sub").textContent = `*you bought ${r.itemCount} things, paid ${money(
        r.outOfPocket
      )} total. The ${product.title.slice(0, 28)} was free.`;
    } else {
      $("r-label").textContent = "girl math price";
      $("r-price").textContent = money(r.girlPrice);
      $("r-price").classList.remove("free");
      $("r-sub").textContent = `Out of pocket for ${r.itemCount} item(s): ${money(
        r.outOfPocket
      )}`;
    }

    const notes = r.lines.map((ln) => ln.note).filter(Boolean);
    $("fine").textContent =
      notes.length > 0
        ? "Fine print: " + notes.join(" · ")
        : "No deals found for this merchant yet.";

    $("copy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(receiptText(product, md, r));
        $("copy").textContent = "✅ copied!";
        setTimeout(() => ($("copy").textContent = "📋 copy receipt"), 1500);
      } catch {
        $("copy").textContent = "copy failed — select manually";
      }
    };
  }

  chrome.storage.local.get("gm_product", ({ gm_product }) => {
    if (gm_product && gm_product.price > 0) render(gm_product);
    else $("empty").hidden = false;
  });
})();
