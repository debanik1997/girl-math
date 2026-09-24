/* ------------------------------------------------------------------
 * Girl Math — background service worker (Phase 0)
 *
 * Phase 0: lights the toolbar badge when a product is detected.
 * Phase 1: affiliate-link routing for cashback lives here
 * (chrome.webRequest / declarativeNetRequest redirect through the
 * network's click-tracking URL before the merchant checkout domain).
 * ------------------------------------------------------------------ */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "GM_PRODUCT" || !msg.product) return;

  // "GM" badge = girl math available on this page.
  chrome.action.setBadgeText({ text: "GM" });
  chrome.action.setBadgeBackgroundColor({ color: "#e75480" });
  chrome.action.setTitle({
    title: `Girl Math: deals found for "${msg.product.title.slice(0, 40)}…"`,
  });
});

// Clear the badge when the user navigates away / closes the tab.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ text: "", tabId });
  }
});
