export default defineContentScript({
    matches: [
        "*://leetcode.com/*",
        "*://leetcode.cn/*",
    ],

    async main() {

        const parse = (csv: any) => {
            let lines: any = csv.split('\n');
            let headers: any = lines[0].split(/\t+/);

            let json: any = {};
            for (let i = 1; i < lines.length; i++) {
                let row = lines[i].split(/\t+/);
                json[row[1]] = Object.fromEntries(headers.map((k: any, i: any) => [k, row[i]]));
            }
            return json;
        }

        const getRatings = async () => {
            const expire = 3600 * 24 * 1000;

            let items = await browser.storage.local.get(['ratings', 'cacheTime']);
            console.log(items);
            if (items.ratings && items.cacheTime && Date.now() < (items.cacheTime as number) + expire) {
                return items.ratings;
            }
            let ratings = parse(
                await fetch(
                    'https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/ratings.txt'
                ).then((res) => res.text()).catch(e => console.log(e))
            );

            await browser.storage.local.set({ ratings: ratings, cacheTime: Date.now() });
            return ratings;
        }

        const replace = (ratings: any, title: any, difficulty: any, showNA: any) => {
            if (!title || !difficulty) return;

            // Only process elements whose text still shows an original difficulty word.
            // This naturally handles React reusing DOM nodes (it resets textContent to
            // the original difficulty, which this check will then pick up again).
            const hasOriginalDifficulty = /([Hh]ard|[Mm]ed\.|[Mm]edium|[Ee]asy|简单|中等|困难)/.test(difficulty.textContent);
            if (!hasOriginalDifficulty) return;

            const id = title.textContent.split('.')[0];
            if (!ratings[id]?.Rating && !showNA) return;

            difficulty.textContent = difficulty.textContent.replace(
                /([Hh]ard|[Mm]ed\.|[Mm]edium|[Ee]asy|简单|中等|困难)/,
                (ratings[id]?.Rating ? ratings[id].Rating.split('.')[0] : 'N/A')
                // + " ▼"
            );
        };

        const replaceShowWarning = (
            ratings: any,
            title: any,
            difficulty: any,
            showNA: any
        ) => {

            if (!title || !difficulty) return;

            if (difficulty.dataset.ratingAttached === "true") {
                return;
            }

            difficulty.dataset.ratingAttached = "true";

            difficulty.classList.add(
                "cursor-pointer",
                "transition-colors",
                "hover:bg-fill-primary",
                "hover:text-text-primary",
                "text-sd-secondary-foreground",
                "hover:opacity-80"
            );

            difficulty.addEventListener("click", () => {

                const proceed = confirm(
                    "Are you sure you want to see the rating?\n\nSeeing ratings may influence your perception of difficulty and reduce blind problem solving."
                );

                if (!proceed) {
                    return;
                }

                replace(
                    ratings,
                    title,
                    difficulty,
                    showNA
                );

            });
        };

        const update = async () => {

            let ratings = await getRatings();
            let showNA = (await browser.storage.local.get('showNA')).showNA;
            let showWarning = (await browser.storage.local.get('showWarning')).showWarning;
            let title, difficulty;

            if (!showWarning) {
                // leetcode.com/problemset/* and leetcode.cn/problemset/*
                document.querySelectorAll('[role="row"]').forEach((ele) => {
                    title = ele.querySelector('[role="cell"]:nth-child(2) a');
                    difficulty = ele.querySelector('[role="cell"]:nth-child(5) span');
                    replace(ratings, title, difficulty, showNA);
                });

                // new leetcode.com/problems/*/
                title = document.querySelector('div > a.text-lg.text-label-1.font-medium');
                difficulty = document.querySelector(
                    'div > div.text-sm.font-medium.capitalize'
                );
                replace(ratings, title, difficulty, showNA);

                // old leetcode.com/problems/*/
                title = document.querySelector('div[data-cy="question-title"]');
                difficulty = document.querySelector(
                    'div[diff="easy"],div[diff="medium"],div[diff="hard"]'
                );
                replace(ratings, title, difficulty, showNA);

                // leetcode.cn/problems/*/
                title = document.querySelector('div[class^="text-title-"]');
                difficulty = document.querySelector('div[class*="text-difficulty-"]');
                replace(ratings, title, difficulty, showNA);

                // leetcode.com/problem-list/*/
                document
                    .querySelectorAll('div > a.group.flex-col, div > div.group.flex-col')
                    .forEach((ele) => {
                        title = ele.querySelector('.ellipsis.line-clamp-1');
                        difficulty = ele.querySelector('p[class*="text-sd-"]');
                        replace(ratings, title, difficulty, showNA);
                    });
            }
            else {
                // new leetcode.com/problems/*/
                title = document.querySelector('div > a.text-lg.text-label-1.font-medium');
                difficulty = document.querySelector(
                    'div > div.text-sm.font-medium.capitalize'
                );
                replaceShowWarning(ratings, title, difficulty, showNA);


                // old leetcode.com/problems/*/
                title = document.querySelector('div[data-cy="question-title"]');
                difficulty = document.querySelector(
                    'div[diff="easy"],div[diff="medium"],div[diff="hard"]'
                );
                replaceShowWarning(ratings, title, difficulty, showNA);


                // leetcode.cn/problems/*/
                title = document.querySelector('div[class^="text-title-"]');
                difficulty = document.querySelector('div[class*="text-difficulty-"]');
                replaceShowWarning(ratings, title, difficulty, showNA);
            }
        }

        let timer: any;
        const debounce = (fn: Function, timeout: number) => {
            return (...args: any) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fn.apply(this, args);
                }, timeout);
            };
        };

        let currentUrl = location.href;
        const debouncedUpdate = debounce(update, 300);

        // Observe the problem table for new rows (virtual scroll / pagination).
        // If the table isn't in the DOM yet, wait for it with a body observer.
        function startProblemsetObserver() {
            function observeTable(table: Element) {
                const tableObserver = new MutationObserver((mutations) => {
                    if (mutations.some((m) => m.addedNodes.length > 0)) {
                        debouncedUpdate();
                    }
                });
                tableObserver.observe(table, { childList: true, subtree: true });
            }

            const table = document.querySelector('[role="table"]');
            if (table) {
                observeTable(table);
                return;
            }

            // Table not rendered yet — wait for it
            const bodyObserver = new MutationObserver(() => {
                const t = document.querySelector('[role="table"]');
                if (t) {
                    bodyObserver.disconnect();
                    observeTable(t);
                    debouncedUpdate();
                }
            });
            bodyObserver.observe(document.body, { childList: true, subtree: true });
        }

        // Observe body for any DOM change, then check if the URL changed.
        // This covers React SPA navigations which don't fire popstate.
        function startUrlObserver() {
            const urlObserver = new MutationObserver(() => {
                if (currentUrl === location.href) return;
                currentUrl = location.href;
                console.log("URL Changed:", currentUrl);
                debouncedUpdate();
            });
            urlObserver.observe(document.body, { childList: true, subtree: true });
        }

        if (location.pathname.startsWith("/problemset")) {
            startProblemsetObserver();
        } else {
            // covers /problems/, /problem-list/, and any other SPA routes
            startUrlObserver();
        }

        // Always run once on initial page load
        debouncedUpdate();
    }
});