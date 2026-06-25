import displayCopyButton from "@/Utils/displayCopyButton";
import displayRatings from "@/Utils/displayRatings";
import displayYtLinks from "@/Utils/displayYtLinks";

export default defineContentScript({
    matches: [
        "*://leetcode.com/*",
        "*://leetcode.cn/*",
    ],

    async main() {
        const runAll = async () => {
            displayRatings();

            const { showYtSolutions, showCopyButton } = await browser.storage.local.get({
                showYtSolutions: true,
                showCopyButton: true,
            });

            if (showYtSolutions) {
                displayYtLinks();
            } else {
                document.querySelector(".lvs-video-section")?.remove();
            }

            if (showCopyButton) {
                displayCopyButton();
            }
        };

        let currentUrl = location.href;
        let debounceTimer: ReturnType<typeof setTimeout>;

        const debouncedRunAll = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(runAll, 300);
        };

        // Single observer for both URL changes (SPA navigation) and
        // DOM additions (new rows on /problemset infinite scroll).
        const observer = new MutationObserver((mutations) => {
            const hasNewElements = mutations.some((m) =>
                Array.from(m.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE)
            );
            if (!hasNewElements) return;

            if (currentUrl !== location.href) {
                // URL changed — full re-run of all 3 functions
                currentUrl = location.href;
                debouncedRunAll();
            } else if (location.pathname.startsWith("/problemset")) {
                // Same URL but new rows rendered on problemset page
                debouncedRunAll();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Run once on initial page load
        runAll();
    }
});