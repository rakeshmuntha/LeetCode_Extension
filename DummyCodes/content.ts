import { browser } from "wxt/browser";
export default defineContentScript({

  matches: [
    "*://leetcode.com/*",
    "*://leetcode.cn/*",
  ],

  async main() {
    console.log("hi there extension is working");
    const parse = (csv: string) => {
      let lines = csv.split("\n");
      let headers = lines[0].split(/\t+/);

      let json: any = {};

      for (let i = 1; i < lines.length; i++) {
        let row = lines[i].split(/\t+/);

        if (!row[1]) continue;

        json[row[1]] = Object.fromEntries(
          headers.map((k, i) => [k, row[i]])
        );
      }

      return json;
    };

    const getRatings = async () => {
      const expire = 24 * 3600 * 1000;

      let items = await browser.storage.local.get([
        "ratings",
        "cacheTime",
      ]);

      if (
        items.ratings &&
        items.cacheTime &&
        Date.now() < items.cacheTime + expire
      ) {
        return items.ratings;
      }

      let ratings = parse(
        await fetch(
          "https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/ratings.txt"
        ).then((res) => res.text())
      );

      await browser.storage.local.set({
        ratings,
        cacheTime: Date.now(),
      });

      return ratings;
    };

    const revealedProblems = new Set<string>();

    const showWarningPopup = () => {
      return new Promise<boolean>((resolve) => {
        const overlay =
          document.createElement("div");

        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.background =
          "rgba(0,0,0,0.5)";
        overlay.style.zIndex = "999999";

        const modal =
          document.createElement("div");

        modal.style.position = "absolute";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform =
          "translate(-50%, -50%)";
        modal.style.background = "white";
        modal.style.padding = "20px";
        modal.style.borderRadius = "8px";
        modal.style.width = "350px";

        modal.innerHTML = `
          <h3>Reveal Rating?</h3>

          <p>
            Seeing the rating may reduce
            blind problem solving and influence
            your perception of difficulty.
          </p>

          <div
            style="
              display:flex;
              justify-content:flex-end;
              gap:10px;
            "
          >
            <button id="lc-cancel">
              Cancel
            </button>

            <button id="lc-proceed">
              Proceed
            </button>
          </div>
        `;

        overlay.appendChild(modal);

        document.body.appendChild(
          overlay
        );

        (
          modal.querySelector(
            "#lc-cancel"
          ) as HTMLButtonElement
        ).onclick = () => {
          overlay.remove();
          resolve(false);
        };

        (
          modal.querySelector(
            "#lc-proceed"
          ) as HTMLButtonElement
        ).onclick = () => {
          overlay.remove();
          resolve(true);
        };
      });
    };

    const replace = (
      ratings: any,
      title: any,
      difficulty: any
    ) => {
      if (!title || !difficulty) return;

      const id =
        title.textContent.split(".")[0];

      const rating =
        ratings[id]?.Rating
          ? ratings[id].Rating.split(".")[0]
          : "N/A";

      difficulty.textContent =
        difficulty.textContent.replace(
          /([Hh]ard|[Mm]ed\.|[Mm]edium|[Ee]asy|简单|中等|困难|\d{3,4}|N\/A)/,
          rating
        );
    };

    const attachHandler = async (
      ratings: any,
      title: any,
      difficulty: any,
      warningEnabled: boolean
    ) => {
      if (!title || !difficulty) return;

      const id =
        title.textContent.split(".")[0];

      if (!warningEnabled) {
        replace(
          ratings,
          title,
          difficulty
        );
        return;
      }

      if (
        revealedProblems.has(id)
      ) {
        replace(
          ratings,
          title,
          difficulty
        );
        return;
      }

      if (
        difficulty.dataset
          .ratingAttached === "true"
      ) {
        return;
      }

      difficulty.dataset.ratingAttached =
        "true";

      difficulty.style.cursor =
        "pointer";

      difficulty.title =
        "Click to reveal rating";

      difficulty.addEventListener(
        "click",
        async () => {
          const proceed =
            await showWarningPopup();

          if (!proceed) return;

          revealedProblems.add(id);

          replace(
            ratings,
            title,
            difficulty
          );
        },
        { once: true }
      );
    };

    const update = async () => {
      observer.disconnect();

      const ratings =
        await getRatings();

      const settings =
        await browser.storage.local.get(
          "showWarningBeforeRating"
        );

      const warningEnabled =
        settings.showWarningBeforeRating;

      let title: any;
      let difficulty: any;

      document
        .querySelectorAll(
          "[role='row']"
        )
        .forEach(async (ele) => {
          title =
            ele.querySelector(
              "[role='cell']:nth-child(2) a"
            );

          difficulty =
            ele.querySelector(
              "[role='cell']:nth-child(5) span"
            );

          await attachHandler(
            ratings,
            title,
            difficulty,
            warningEnabled
          );
        });

      title =
        document.querySelector(
          "div > a.text-lg.text-label-1.font-medium"
        );

      difficulty =
        document.querySelector(
          "div > div.text-sm.font-medium.capitalize"
        );

      await attachHandler(
        ratings,
        title,
        difficulty,
        warningEnabled
      );

      title =
        document.querySelector(
          'div[data-cy="question-title"]'
        );

      difficulty =
        document.querySelector(
          'div[diff="easy"],div[diff="medium"],div[diff="hard"]'
        );

      await attachHandler(
        ratings,
        title,
        difficulty,
        warningEnabled
      );

      title =
        document.querySelector(
          'div[class^="text-title-"]'
        );

      difficulty =
        document.querySelector(
          'div[class*="text-difficulty-"]'
        );

      await attachHandler(
        ratings,
        title,
        difficulty,
        warningEnabled
      );

      document
        .querySelectorAll(
          "div > a.group.flex-col, div > div.group.flex-col"
        )
        .forEach(async (ele) => {
          title =
            ele.querySelector(
              ".ellipsis.line-clamp-1"
            );

          difficulty =
            ele.querySelector(
              'p[class*="text-sd-"]'
            );

          await attachHandler(
            ratings,
            title,
            difficulty,
            warningEnabled
          );
        });

      observer.observe(
        document.body,
        {
          subtree: true,
          childList: true,
        }
      );
    };

    let timer: number;

    const debounce = (
      func: Function,
      timeout: number
    ) => {
      return (...args: any[]) => {
        clearTimeout(timer);

        timer =
          window.setTimeout(
            () =>
              func.apply(
                this,
                args
              ),
            timeout
          );
      };
    };

    const debouncedUpdate = debounce(update, 300);

    const observer =
      new MutationObserver(
        () => {
          debouncedUpdate();
        }
      );

    observer.observe(
      document.body,
      {
        subtree: true,
        childList: true,
      }
    );
  },
});