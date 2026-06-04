export default defineBackground(() => {
    console.log('Hello background!', { id: browser.runtime.id });
    browser.runtime.onInstalled.addListener(async () => {
        await browser.storage.local.set({
            showWarning: (await browser.storage.local.get({ showWarning: true })).showWarning,
            showNA: (await browser.storage.local.get({ showNA: true })).showNA,
            cacheTime: 0,
        });
    });
});
