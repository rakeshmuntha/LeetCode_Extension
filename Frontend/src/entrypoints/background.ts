export default defineBackground(() => {
    console.log('Hello background!', { id: browser.runtime.id });
    browser.runtime.onInstalled.addListener(async () => {
        await browser.storage.local.set({
            showWarning: (await browser.storage.local.get({ showWarning: true })).showWarning,
            showNA: (await browser.storage.local.get({ showNA: true })).showNA,
            cacheTime: 0,
        });
    });
    browser.runtime.onMessage.addListener(
        async (message) => {
            if (message.type === "youtube-search") {
                const response = await fetch(
                    `https://leet-code-extension-five.vercel.app/api/youtube?problemTitle=${encodeURIComponent(
                        message.question
                    )}`
                );

                return response.json();
            }
        }
    );
});
