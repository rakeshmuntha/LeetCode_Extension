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
            const id = title.textContent.split('.')[0];

            if (!ratings[id]?.Rating && !showNA) return;

            difficulty.textContent = difficulty.textContent.replace(
                /([Hh]ard|[Mm]ed\.|[Mm]edium|[Ee]asy|简单|中等|困难|\d{3,4}|N\/A)/,
                ratings[id]?.Rating
                    ? ratings[id].Rating.split('.')[0] : 'N/A' // no data available
            );
        };

        const update = async () => {

            observer.disconnect();
            let ratings = await getRatings();
            let showNA = (await browser.storage.local.get('showNA')).showNA;
            let title, difficulty;

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

            observer.observe(document.body, {
                subtree: true,
                childList: true,
            });
        }

        let timer: any;
        const debounce = (fn: Function, timeout: number) => {
            return (...args: any) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fn.apply(this, args)
                }, timeout);
            }
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(debounce(update, 300));
        })

        observer.observe(document.body, {
            subtree: true,
            childList: true
        })
    }
});