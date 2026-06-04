import { browser } from "wxt/browser";
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await browser.storage.local.set({
      showWarningBeforeRating: false,
      cacheTime: 0,
    });
  });
});