/* Functional test for the Girl Math Phase 0 popup.
 * Loads the REAL popup.html + deals.js + popup.js in jsdom with a
 * stubbed chrome.storage, then asserts on the rendered math. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.resolve(__dirname, "..");

function loadPopup(storedProduct) {
  const html = fs.readFileSync(path.join(EXT, "src/popup.html"), "utf8");
  const deals = fs.readFileSync(path.join(EXT, "src/deals.js"), "utf8");
  const popup = fs.readFileSync(path.join(EXT, "src/popup.js"), "utf8");

  const dom = new JSDOM(html, {
    url: "chrome-extension://test/src/popup.html",
    runScripts: "outside-only",
    beforeParse(window) {
      window.chrome = {
        storage: {
          local: {
            get: (keys, cb) => cb(storedProduct ? { gm_product: storedProduct } : {}),
            set: () => {},
          },
        },
      };
      // jsdom has no clipboard; the copy button is only wired, not clicked.
      if (!window.navigator.clipboard) window.navigator.clipboard = {};
    },
  });

  dom.window.eval(
    deals + "\nwindow.GIRL_MATH_DEALS = GIRL_MATH_DEALS;\nwindow.GIRL_MATH_HOSTS = GIRL_MATH_HOSTS;"
  );
  dom.window.eval(popup);
  return dom.window.document;
}

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}
const text = (doc, id) => doc.getElementById(id).textContent;

// --- Scenario 1: $120 headphones on Amazon, no bundle selected ----------------
console.log("Scenario 1: $120 item, deals only (no bundle)");
{
  const doc = loadPopup({
    merchant: "amazon",
    title: "Sony WH-1000XM5 Wireless Headphones",
    price: 120.0,
    url: "https://www.amazon.com/dp/TEST",
  });
  check("main visible", !doc.getElementById("main").hidden);
  check("product title", text(doc, "p-title").includes("Sony"));
  check("product price", text(doc, "p-price") === "$120.00");

  const lines = [...doc.querySelectorAll("#lines .line")].map((el) => el.textContent);
  check("code line -$12.00", lines.some((l) => l.includes("−$12.00")), JSON.stringify(lines));
  check("cashback line -$5.40", lines.some((l) => l.includes("−$5.40")), JSON.stringify(lines));
  check("total savings -$17.40", lines.some((l) => l.includes("Total savings") && l.includes("−$17.40")));
  // 120 - 17.40 = 102.60, not free
  check("girl math price $102.60", text(doc, "r-price") === "$102.60", text(doc, "r-price"));
  check("not FREE", !text(doc, "r-price").includes("FREE"));
  check(
    "out of pocket $102.60",
    text(doc, "r-sub").includes("$102.60"),
    text(doc, "r-sub")
  );
}

// --- Scenario 2: same item + refurbished tablet bundle -> FREE ---------------
console.log("Scenario 2: $120 item + tablet bundle (should be FREE)");
{
  const doc = loadPopup({
    merchant: "amazon",
    title: "Sony WH-1000XM5 Wireless Headphones",
    price: 120.0,
    url: "https://www.amazon.com/dp/TEST",
  });
  // Select the tablet bundle radio, then re-fire change to re-render.
  const radio = doc.querySelector('input[name="bundle"][value="amazon:bundle:tablet"]');
  check("tablet bundle option exists", !!radio);
  radio.checked = true;
  doc.getElementById("bundles").dispatchEvent(new doc.defaultView.Event("change", { bubbles: true }));

  const lines = [...doc.querySelectorAll("#lines .line")].map((el) => el.textContent);
  check("bundle line -$112.50", lines.some((l) => l.includes("−$112.50")), JSON.stringify(lines));
  check("total savings -$129.90", lines.some((l) => l.includes("Total savings") && l.includes("−$129.90")));
  check("girl math price FREE*", text(doc, "r-price") === "FREE*", text(doc, "r-price"));
  check(
    "sub explains 2 items / $137.50 out of pocket",
    text(doc, "r-sub").includes("2 things") && text(doc, "r-sub").includes("$137.50"),
    text(doc, "r-sub")
  );
  check("fine print present", doc.getElementById("fine").textContent.includes("One code per order"));
}

// --- Scenario 3: no product -> empty state -----------------------------------
console.log("Scenario 3: no product detected");
{
  const doc = loadPopup(null);
  check("empty state visible", !doc.getElementById("empty").hidden);
  check("main hidden", doc.getElementById("main").hidden);
}

// --- Scenario 4: non-stackable code respected (Nike) --------------------------
console.log("Scenario 4: Nike $150 shoes, non-stackable code + cashback");
{
  const doc = loadPopup({ merchant: "nike", title: "Air Zoom Pegasus", price: 150.0, url: "https://www.nike.com/t/TEST" });
  const lines = [...doc.querySelectorAll("#lines .line")].map((el) => el.textContent);
  // 15% of 150 = 22.50; cashback 10% of 127.50 = 12.75; total 35.25 -> price 114.75
  check("code line -$22.50", lines.some((l) => l.includes("−$22.50")), JSON.stringify(lines));
  check("cashback line -$12.75", lines.some((l) => l.includes("−$12.75")), JSON.stringify(lines));
  check("girl math price $114.75", text(doc, "r-price") === "$114.75", text(doc, "r-price"));
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
