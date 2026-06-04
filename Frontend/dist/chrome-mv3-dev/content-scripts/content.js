var content = (function() {
	//#region node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region src/entrypoints/content.ts
	var content_default = defineContentScript({
		matches: ["*://leetcode.com/*", "*://leetcode.cn/*"],
		async main() {
			const parse = (csv) => {
				let lines = csv.split("\n");
				let headers = lines[0].split(/\t+/);
				let json = {};
				for (let i = 1; i < lines.length; i++) {
					let row = lines[i].split(/\t+/);
					json[row[1]] = Object.fromEntries(headers.map((k, i) => [k, row[i]]));
				}
				return json;
			};
			const getRatings = async () => {
				const expire = 3600 * 24 * 1e3;
				let items = await browser.storage.local.get(["ratings", "cacheTime"]);
				console.log(items);
				if (items.ratings && items.cacheTime && Date.now() < items.cacheTime + expire) return items.ratings;
				let ratings = parse(await fetch("https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/ratings.txt").then((res) => res.text()).catch((e) => console.log(e)));
				await browser.storage.local.set({
					ratings,
					cacheTime: Date.now()
				});
				return ratings;
			};
			const replace = (ratings, title, difficulty, showNA) => {
				if (!title || !difficulty) return;
				if (!/([Hh]ard|[Mm]ed\.|[Mm]edium|[Ee]asy|简单|中等|困难)/.test(difficulty.textContent)) return;
				const id = title.textContent.split(".")[0];
				if (!ratings[id]?.Rating && !showNA) return;
				difficulty.textContent = difficulty.textContent.replace(/([Hh]ard|[Mm]ed\.|[Mm]edium|[Ee]asy|简单|中等|困难)/, ratings[id]?.Rating ? ratings[id].Rating.split(".")[0] : "N/A");
			};
			const replaceShowWarning = (ratings, title, difficulty, showNA) => {
				if (!title || !difficulty) return;
				if (difficulty.dataset.ratingAttached === "true") return;
				difficulty.dataset.ratingAttached = "true";
				difficulty.classList.add("cursor-pointer", "transition-colors", "hover:bg-fill-primary", "hover:text-text-primary", "text-sd-secondary-foreground", "hover:opacity-80");
				difficulty.addEventListener("click", () => {
					if (!confirm("Are you sure you want to see the rating?\n\nSeeing ratings may influence your perception of difficulty and reduce blind problem solving.")) return;
					replace(ratings, title, difficulty, showNA);
				});
			};
			const update = async () => {
				let ratings = await getRatings();
				let showNA = (await browser.storage.local.get("showNA")).showNA;
				let showWarning = (await browser.storage.local.get("showWarning")).showWarning;
				let title, difficulty;
				if (!showWarning) {
					document.querySelectorAll("[role=\"row\"]").forEach((ele) => {
						title = ele.querySelector("[role=\"cell\"]:nth-child(2) a");
						difficulty = ele.querySelector("[role=\"cell\"]:nth-child(5) span");
						replace(ratings, title, difficulty, showNA);
					});
					title = document.querySelector("div > a.text-lg.text-label-1.font-medium");
					difficulty = document.querySelector("div > div.text-sm.font-medium.capitalize");
					replace(ratings, title, difficulty, showNA);
					title = document.querySelector("div[data-cy=\"question-title\"]");
					difficulty = document.querySelector("div[diff=\"easy\"],div[diff=\"medium\"],div[diff=\"hard\"]");
					replace(ratings, title, difficulty, showNA);
					title = document.querySelector("div[class^=\"text-title-\"]");
					difficulty = document.querySelector("div[class*=\"text-difficulty-\"]");
					replace(ratings, title, difficulty, showNA);
					document.querySelectorAll("div > a.group.flex-col, div > div.group.flex-col").forEach((ele) => {
						title = ele.querySelector(".ellipsis.line-clamp-1");
						difficulty = ele.querySelector("p[class*=\"text-sd-\"]");
						replace(ratings, title, difficulty, showNA);
					});
				} else {
					title = document.querySelector("div > a.text-lg.text-label-1.font-medium");
					difficulty = document.querySelector("div > div.text-sm.font-medium.capitalize");
					replaceShowWarning(ratings, title, difficulty, showNA);
					title = document.querySelector("div[data-cy=\"question-title\"]");
					difficulty = document.querySelector("div[diff=\"easy\"],div[diff=\"medium\"],div[diff=\"hard\"]");
					replaceShowWarning(ratings, title, difficulty, showNA);
					title = document.querySelector("div[class^=\"text-title-\"]");
					difficulty = document.querySelector("div[class*=\"text-difficulty-\"]");
					replaceShowWarning(ratings, title, difficulty, showNA);
				}
			};
			let timer;
			const debounce = (fn, timeout) => {
				return (...args) => {
					clearTimeout(timer);
					timer = setTimeout(() => {
						fn.apply(this, args);
					}, timeout);
				};
			};
			let currentUrl = location.href;
			const debouncedUpdate = debounce(update, 300);
			function startProblemsetObserver() {
				new MutationObserver((mutations) => {
					if (mutations.some((m) => Array.from(m.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE))) debouncedUpdate();
				}).observe(document.body, {
					childList: true,
					subtree: true
				});
			}
			function startUrlObserver() {
				new MutationObserver((mutations) => {
					if (!mutations.some((m) => Array.from(m.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE))) return;
					if (currentUrl === location.href) return;
					currentUrl = location.href;
					console.log("URL Changed:", currentUrl);
					debouncedUpdate();
				}).observe(document.body, {
					childList: true,
					subtree: true
				});
			}
			if (location.pathname.startsWith("/problemset")) startProblemsetObserver();
			else startUrlObserver();
			debouncedUpdate();
		}
	});
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			if (!this.options?.noScriptStartedPostMessage) window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?C:/Users/MunthaRakesh/Desktop/LeetCode_Extension/Frontend/src/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL3NyYy9lbnRyeXBvaW50cy9jb250ZW50LnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xyXG4gICAgbWF0Y2hlczogW1xyXG4gICAgICAgIFwiKjovL2xlZXRjb2RlLmNvbS8qXCIsXHJcbiAgICAgICAgXCIqOi8vbGVldGNvZGUuY24vKlwiLFxyXG4gICAgXSxcclxuXHJcbiAgICBhc3luYyBtYWluKCkge1xyXG5cclxuICAgICAgICBjb25zdCBwYXJzZSA9IChjc3Y6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbGluZXM6IGFueSA9IGNzdi5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgIGxldCBoZWFkZXJzOiBhbnkgPSBsaW5lc1swXS5zcGxpdCgvXFx0Ky8pO1xyXG5cclxuICAgICAgICAgICAgbGV0IGpzb246IGFueSA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcm93ID0gbGluZXNbaV0uc3BsaXQoL1xcdCsvKTtcclxuICAgICAgICAgICAgICAgIGpzb25bcm93WzFdXSA9IE9iamVjdC5mcm9tRW50cmllcyhoZWFkZXJzLm1hcCgoazogYW55LCBpOiBhbnkpID0+IFtrLCByb3dbaV1dKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGpzb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBnZXRSYXRpbmdzID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBleHBpcmUgPSAzNjAwICogMjQgKiAxMDAwO1xyXG5cclxuICAgICAgICAgICAgbGV0IGl0ZW1zID0gYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldChbJ3JhdGluZ3MnLCAnY2FjaGVUaW1lJ10pO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtcyk7XHJcbiAgICAgICAgICAgIGlmIChpdGVtcy5yYXRpbmdzICYmIGl0ZW1zLmNhY2hlVGltZSAmJiBEYXRlLm5vdygpIDwgKGl0ZW1zLmNhY2hlVGltZSBhcyBudW1iZXIpICsgZXhwaXJlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbXMucmF0aW5ncztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgcmF0aW5ncyA9IHBhcnNlKFxyXG4gICAgICAgICAgICAgICAgYXdhaXQgZmV0Y2goXHJcbiAgICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS96ZXJvdHJhYy9sZWV0Y29kZV9wcm9ibGVtX3JhdGluZy9tYWluL3JhdGluZ3MudHh0J1xyXG4gICAgICAgICAgICAgICAgKS50aGVuKChyZXMpID0+IHJlcy50ZXh0KCkpLmNhdGNoKGUgPT4gY29uc29sZS5sb2coZSkpXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0KHsgcmF0aW5nczogcmF0aW5ncywgY2FjaGVUaW1lOiBEYXRlLm5vdygpIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmF0aW5ncztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcGxhY2UgPSAocmF0aW5nczogYW55LCB0aXRsZTogYW55LCBkaWZmaWN1bHR5OiBhbnksIHNob3dOQTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGl0bGUgfHwgIWRpZmZpY3VsdHkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIC8vIE9ubHkgcHJvY2VzcyBlbGVtZW50cyB3aG9zZSB0ZXh0IHN0aWxsIHNob3dzIGFuIG9yaWdpbmFsIGRpZmZpY3VsdHkgd29yZC5cclxuICAgICAgICAgICAgLy8gVGhpcyBuYXR1cmFsbHkgaGFuZGxlcyBSZWFjdCByZXVzaW5nIERPTSBub2RlcyAoaXQgcmVzZXRzIHRleHRDb250ZW50IHRvXHJcbiAgICAgICAgICAgIC8vIHRoZSBvcmlnaW5hbCBkaWZmaWN1bHR5LCB3aGljaCB0aGlzIGNoZWNrIHdpbGwgdGhlbiBwaWNrIHVwIGFnYWluKS5cclxuICAgICAgICAgICAgY29uc3QgaGFzT3JpZ2luYWxEaWZmaWN1bHR5ID0gLyhbSGhdYXJkfFtNbV1lZFxcLnxbTW1dZWRpdW18W0VlXWFzeXznroDljZV85Lit562JfOWbsOmavikvLnRlc3QoZGlmZmljdWx0eS50ZXh0Q29udGVudCk7XHJcbiAgICAgICAgICAgIGlmICghaGFzT3JpZ2luYWxEaWZmaWN1bHR5KSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpZCA9IHRpdGxlLnRleHRDb250ZW50LnNwbGl0KCcuJylbMF07XHJcbiAgICAgICAgICAgIGlmICghcmF0aW5nc1tpZF0/LlJhdGluZyAmJiAhc2hvd05BKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBkaWZmaWN1bHR5LnRleHRDb250ZW50ID0gZGlmZmljdWx0eS50ZXh0Q29udGVudC5yZXBsYWNlKFxyXG4gICAgICAgICAgICAgICAgLyhbSGhdYXJkfFtNbV1lZFxcLnxbTW1dZWRpdW18W0VlXWFzeXznroDljZV85Lit562JfOWbsOmavikvLFxyXG4gICAgICAgICAgICAgICAgKHJhdGluZ3NbaWRdPy5SYXRpbmcgPyByYXRpbmdzW2lkXS5SYXRpbmcuc3BsaXQoJy4nKVswXSA6ICdOL0EnKVxyXG4gICAgICAgICAgICAgICAgLy8gKyBcIiDilrxcIlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcGxhY2VTaG93V2FybmluZyA9IChcclxuICAgICAgICAgICAgcmF0aW5nczogYW55LFxyXG4gICAgICAgICAgICB0aXRsZTogYW55LFxyXG4gICAgICAgICAgICBkaWZmaWN1bHR5OiBhbnksXHJcbiAgICAgICAgICAgIHNob3dOQTogYW55XHJcbiAgICAgICAgKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRpdGxlIHx8ICFkaWZmaWN1bHR5KSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlmZmljdWx0eS5kYXRhc2V0LnJhdGluZ0F0dGFjaGVkID09PSBcInRydWVcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkaWZmaWN1bHR5LmRhdGFzZXQucmF0aW5nQXR0YWNoZWQgPSBcInRydWVcIjtcclxuXHJcbiAgICAgICAgICAgIGRpZmZpY3VsdHkuY2xhc3NMaXN0LmFkZChcclxuICAgICAgICAgICAgICAgIFwiY3Vyc29yLXBvaW50ZXJcIixcclxuICAgICAgICAgICAgICAgIFwidHJhbnNpdGlvbi1jb2xvcnNcIixcclxuICAgICAgICAgICAgICAgIFwiaG92ZXI6YmctZmlsbC1wcmltYXJ5XCIsXHJcbiAgICAgICAgICAgICAgICBcImhvdmVyOnRleHQtdGV4dC1wcmltYXJ5XCIsXHJcbiAgICAgICAgICAgICAgICBcInRleHQtc2Qtc2Vjb25kYXJ5LWZvcmVncm91bmRcIixcclxuICAgICAgICAgICAgICAgIFwiaG92ZXI6b3BhY2l0eS04MFwiXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBkaWZmaWN1bHR5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvY2VlZCA9IGNvbmZpcm0oXHJcbiAgICAgICAgICAgICAgICAgICAgXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gc2VlIHRoZSByYXRpbmc/XFxuXFxuU2VlaW5nIHJhdGluZ3MgbWF5IGluZmx1ZW5jZSB5b3VyIHBlcmNlcHRpb24gb2YgZGlmZmljdWx0eSBhbmQgcmVkdWNlIGJsaW5kIHByb2JsZW0gc29sdmluZy5cIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXByb2NlZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVwbGFjZShcclxuICAgICAgICAgICAgICAgICAgICByYXRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpZmZpY3VsdHksXHJcbiAgICAgICAgICAgICAgICAgICAgc2hvd05BXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCB1cGRhdGUgPSBhc3luYyAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmF0aW5ncyA9IGF3YWl0IGdldFJhdGluZ3MoKTtcclxuICAgICAgICAgICAgbGV0IHNob3dOQSA9IChhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KCdzaG93TkEnKSkuc2hvd05BO1xyXG4gICAgICAgICAgICBsZXQgc2hvd1dhcm5pbmcgPSAoYXdhaXQgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCgnc2hvd1dhcm5pbmcnKSkuc2hvd1dhcm5pbmc7XHJcbiAgICAgICAgICAgIGxldCB0aXRsZSwgZGlmZmljdWx0eTtcclxuXHJcbiAgICAgICAgICAgIGlmICghc2hvd1dhcm5pbmcpIHtcclxuICAgICAgICAgICAgICAgIC8vIGxlZXRjb2RlLmNvbS9wcm9ibGVtc2V0LyogYW5kIGxlZXRjb2RlLmNuL3Byb2JsZW1zZXQvKlxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3JvbGU9XCJyb3dcIl0nKS5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IGVsZS5xdWVyeVNlbGVjdG9yKCdbcm9sZT1cImNlbGxcIl06bnRoLWNoaWxkKDIpIGEnKTtcclxuICAgICAgICAgICAgICAgICAgICBkaWZmaWN1bHR5ID0gZWxlLnF1ZXJ5U2VsZWN0b3IoJ1tyb2xlPVwiY2VsbFwiXTpudGgtY2hpbGQoNSkgc3BhbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2UocmF0aW5ncywgdGl0bGUsIGRpZmZpY3VsdHksIHNob3dOQSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuZXcgbGVldGNvZGUuY29tL3Byb2JsZW1zLyovXHJcbiAgICAgICAgICAgICAgICB0aXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdiA+IGEudGV4dC1sZy50ZXh0LWxhYmVsLTEuZm9udC1tZWRpdW0nKTtcclxuICAgICAgICAgICAgICAgIGRpZmZpY3VsdHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxyXG4gICAgICAgICAgICAgICAgICAgICdkaXYgPiBkaXYudGV4dC1zbS5mb250LW1lZGl1bS5jYXBpdGFsaXplJ1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHJlcGxhY2UocmF0aW5ncywgdGl0bGUsIGRpZmZpY3VsdHksIHNob3dOQSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2xkIGxlZXRjb2RlLmNvbS9wcm9ibGVtcy8qL1xyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXZbZGF0YS1jeT1cInF1ZXN0aW9uLXRpdGxlXCJdJyk7XHJcbiAgICAgICAgICAgICAgICBkaWZmaWN1bHR5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcclxuICAgICAgICAgICAgICAgICAgICAnZGl2W2RpZmY9XCJlYXN5XCJdLGRpdltkaWZmPVwibWVkaXVtXCJdLGRpdltkaWZmPVwiaGFyZFwiXSdcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXBsYWNlKHJhdGluZ3MsIHRpdGxlLCBkaWZmaWN1bHR5LCBzaG93TkEpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGxlZXRjb2RlLmNuL3Byb2JsZW1zLyovXHJcbiAgICAgICAgICAgICAgICB0aXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdltjbGFzc149XCJ0ZXh0LXRpdGxlLVwiXScpO1xyXG4gICAgICAgICAgICAgICAgZGlmZmljdWx0eSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdltjbGFzcyo9XCJ0ZXh0LWRpZmZpY3VsdHktXCJdJyk7XHJcbiAgICAgICAgICAgICAgICByZXBsYWNlKHJhdGluZ3MsIHRpdGxlLCBkaWZmaWN1bHR5LCBzaG93TkEpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGxlZXRjb2RlLmNvbS9wcm9ibGVtLWxpc3QvKi9cclxuICAgICAgICAgICAgICAgIGRvY3VtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoJ2RpdiA+IGEuZ3JvdXAuZmxleC1jb2wsIGRpdiA+IGRpdi5ncm91cC5mbGV4LWNvbCcpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IGVsZS5xdWVyeVNlbGVjdG9yKCcuZWxsaXBzaXMubGluZS1jbGFtcC0xJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZpY3VsdHkgPSBlbGUucXVlcnlTZWxlY3RvcigncFtjbGFzcyo9XCJ0ZXh0LXNkLVwiXScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXBsYWNlKHJhdGluZ3MsIHRpdGxlLCBkaWZmaWN1bHR5LCBzaG93TkEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gbmV3IGxlZXRjb2RlLmNvbS9wcm9ibGVtcy8qL1xyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYgPiBhLnRleHQtbGcudGV4dC1sYWJlbC0xLmZvbnQtbWVkaXVtJyk7XHJcbiAgICAgICAgICAgICAgICBkaWZmaWN1bHR5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcclxuICAgICAgICAgICAgICAgICAgICAnZGl2ID4gZGl2LnRleHQtc20uZm9udC1tZWRpdW0uY2FwaXRhbGl6ZSdcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXBsYWNlU2hvd1dhcm5pbmcocmF0aW5ncywgdGl0bGUsIGRpZmZpY3VsdHksIHNob3dOQSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9sZCBsZWV0Y29kZS5jb20vcHJvYmxlbXMvKi9cclxuICAgICAgICAgICAgICAgIHRpdGxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2W2RhdGEtY3k9XCJxdWVzdGlvbi10aXRsZVwiXScpO1xyXG4gICAgICAgICAgICAgICAgZGlmZmljdWx0eSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgICAgICAgICAgICAgICAgJ2RpdltkaWZmPVwiZWFzeVwiXSxkaXZbZGlmZj1cIm1lZGl1bVwiXSxkaXZbZGlmZj1cImhhcmRcIl0nXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmVwbGFjZVNob3dXYXJuaW5nKHJhdGluZ3MsIHRpdGxlLCBkaWZmaWN1bHR5LCBzaG93TkEpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBsZWV0Y29kZS5jbi9wcm9ibGVtcy8qL1xyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXZbY2xhc3NePVwidGV4dC10aXRsZS1cIl0nKTtcclxuICAgICAgICAgICAgICAgIGRpZmZpY3VsdHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXZbY2xhc3MqPVwidGV4dC1kaWZmaWN1bHR5LVwiXScpO1xyXG4gICAgICAgICAgICAgICAgcmVwbGFjZVNob3dXYXJuaW5nKHJhdGluZ3MsIHRpdGxlLCBkaWZmaWN1bHR5LCBzaG93TkEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGltZXI6IGFueTtcclxuICAgICAgICBjb25zdCBkZWJvdW5jZSA9IChmbjogRnVuY3Rpb24sIHRpbWVvdXQ6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3M6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aW1lb3V0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgY3VycmVudFVybCA9IGxvY2F0aW9uLmhyZWY7XHJcbiAgICAgICAgY29uc3QgZGVib3VuY2VkVXBkYXRlID0gZGVib3VuY2UodXBkYXRlLCAzMDApO1xyXG5cclxuICAgICAgICAvLyBXYXRjaCBib2R5IGZvciBhZGRlZCBlbGVtZW50IG5vZGVzIChuZXcgcm93cyByZW5kZXJlZCBieSBSZWFjdCkuXHJcbiAgICAgICAgLy8gV2F0Y2hpbmcgYm9keSAobm90IHRoZSB0YWJsZSBlbGVtZW50IGRpcmVjdGx5KSBhdm9pZHMgc3RhbGUgcmVmZXJlbmNlXHJcbiAgICAgICAgLy8gaXNzdWVzIHdoZXJlIFJlYWN0IHVubW91bnRzIGFuZCByZW1vdW50cyB0aGUgdGFibGUgZHVyaW5nIGRhdGEgbG9hZC5cclxuICAgICAgICAvLyBUZXh0IG5vZGUgY2hhbmdlcyBmcm9tIG91ciBvd24gdGV4dENvbnRlbnQgd3JpdGVzIGFyZSBub2RlVHlwZSBURVhUX05PREVcclxuICAgICAgICAvLyBhbmQgYXJlIGlnbm9yZWQgYnkgdGhlIGVsZW1lbnQgZmlsdGVyIOKAlCBvdXIgd3JpdGVzIGRvbid0IHJlLXRyaWdnZXIgdGhpcy5cclxuICAgICAgICBmdW5jdGlvbiBzdGFydFByb2JsZW1zZXRPYnNlcnZlcigpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNOZXdFbGVtZW50cyA9IG11dGF0aW9ucy5zb21lKChtKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20obS5hZGRlZE5vZGVzKS5zb21lKChuKSA9PiBuLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFzTmV3RWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJvdW5jZWRVcGRhdGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPYnNlcnZlIGJvZHkgZm9yIGFueSBET00gY2hhbmdlLCB0aGVuIGNoZWNrIGlmIHRoZSBVUkwgY2hhbmdlZC5cclxuICAgICAgICAvLyBUaGlzIGNvdmVycyBSZWFjdCBTUEEgbmF2aWdhdGlvbnMgd2hpY2ggZG9uJ3QgZmlyZSBwb3BzdGF0ZS5cclxuICAgICAgICBmdW5jdGlvbiBzdGFydFVybE9ic2VydmVyKCkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmxPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIElnbm9yZSB0ZXh0IG5vZGUgbXV0YXRpb25zIGZyb20gb3VyIG93biB0ZXh0Q29udGVudCB3cml0ZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc05ld0VsZW1lbnRzID0gbXV0YXRpb25zLnNvbWUoKG0pID0+XHJcbiAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShtLmFkZGVkTm9kZXMpLnNvbWUoKG4pID0+IG4ubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGlmICghaGFzTmV3RWxlbWVudHMpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VXJsID09PSBsb2NhdGlvbi5ocmVmKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VXJsID0gbG9jYXRpb24uaHJlZjtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVVJMIENoYW5nZWQ6XCIsIGN1cnJlbnRVcmwpO1xyXG4gICAgICAgICAgICAgICAgZGVib3VuY2VkVXBkYXRlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB1cmxPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoXCIvcHJvYmxlbXNldFwiKSkge1xyXG4gICAgICAgICAgICBzdGFydFByb2JsZW1zZXRPYnNlcnZlcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGNvdmVycyAvcHJvYmxlbXMvLCAvcHJvYmxlbS1saXN0LywgYW5kIGFueSBvdGhlciBTUEEgcm91dGVzXHJcbiAgICAgICAgICAgIHN0YXJ0VXJsT2JzZXJ2ZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsd2F5cyBydW4gb25jZSBvbiBpbml0aWFsIHBhZ2UgbG9hZFxyXG4gICAgICAgIGRlYm91bmNlZFVwZGF0ZSgpO1xyXG4gICAgfVxyXG59KTsiLCIvLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvZ2dlci50c1xuZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG5cdGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcblx0aWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSBtZXRob2QoYFt3eHRdICR7YXJncy5zaGlmdCgpfWAsIC4uLmFyZ3MpO1xuXHRlbHNlIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xufVxuLyoqIFdyYXBwZXIgYXJvdW5kIGBjb25zb2xlYCB3aXRoIGEgXCJbd3h0XVwiIHByZWZpeCAqL1xuY29uc3QgbG9nZ2VyID0ge1xuXHRkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuXHRsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG5cdHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuXHRlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBsb2dnZXIgfTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy50c1xudmFyIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgPSBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuXHRzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcblx0Y29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcblx0XHRzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcblx0XHR0aGlzLm5ld1VybCA9IG5ld1VybDtcblx0XHR0aGlzLm9sZFVybCA9IG9sZFVybDtcblx0fVxufTtcbi8qKlxuKiBSZXR1cm5zIGFuIGV2ZW50IG5hbWUgdW5pcXVlIHRvIHRoZSBleHRlbnNpb24gYW5kIGNvbnRlbnQgc2NyaXB0IHRoYXQnc1xuKiBydW5uaW5nLlxuKi9cbmZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcblx0cmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LCBnZXRVbmlxdWVFdmVudE5hbWUgfTtcbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLnRzXG5jb25zdCBzdXBwb3J0c05hdmlnYXRpb25BcGkgPSB0eXBlb2YgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG4vKipcbiogQ3JlYXRlIGEgdXRpbCB0aGF0IHdhdGNoZXMgZm9yIFVSTCBjaGFuZ2VzLCBkaXNwYXRjaGluZyB0aGUgY3VzdG9tIGV2ZW50IHdoZW5cbiogZGV0ZWN0ZWQuIFN0b3BzIHdhdGNoaW5nIHdoZW4gY29udGVudCBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuIFVzZXMgTmF2aWdhdGlvblxuKiBBUEkgd2hlbiBhdmFpbGFibGUsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuXHRsZXQgbGFzdFVybDtcblx0bGV0IHdhdGNoaW5nID0gZmFsc2U7XG5cdHJldHVybiB7IHJ1bigpIHtcblx0XHRpZiAod2F0Y2hpbmcpIHJldHVybjtcblx0XHR3YXRjaGluZyA9IHRydWU7XG5cdFx0bGFzdFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0aWYgKHN1cHBvcnRzTmF2aWdhdGlvbkFwaSkgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJuYXZpZ2F0ZVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwoZXZlbnQuZGVzdGluYXRpb24udXJsKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiA9PT0gbGFzdFVybC5ocmVmKSByZXR1cm47XG5cdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0fSwgeyBzaWduYWw6IGN0eC5zaWduYWwgfSk7XG5cdFx0ZWxzZSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiAhPT0gbGFzdFVybC5ocmVmKSB7XG5cdFx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdFx0fVxuXHRcdH0sIDFlMyk7XG5cdH0gfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC50c1xuLyoqXG4qIEltcGxlbWVudHNcbiogW2BBYm9ydENvbnRyb2xsZXJgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRDb250cm9sbGVyKS5cbiogVXNlZCB0byBkZXRlY3QgYW5kIHN0b3AgY29udGVudCBzY3JpcHQgY29kZSB3aGVuIHRoZSBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuXG4qXG4qIEl0IGFsc28gcHJvdmlkZXMgc2V2ZXJhbCB1dGlsaXRpZXMgbGlrZSBgY3R4LnNldFRpbWVvdXRgIGFuZFxuKiBgY3R4LnNldEludGVydmFsYCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIGNvbnRlbnQgc2NyaXB0cyBpbnN0ZWFkIG9mXG4qIGB3aW5kb3cuc2V0VGltZW91dGAgb3IgYHdpbmRvdy5zZXRJbnRlcnZhbGAuXG4qXG4qIFRvIGNyZWF0ZSBjb250ZXh0IGZvciB0ZXN0aW5nLCB5b3UgY2FuIHVzZSB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvcjpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfSBmcm9tICd3eHQvdXRpbHMvY29udGVudC1zY3JpcHRzLWNvbnRleHQnO1xuKlxuKiB0ZXN0KCdzdG9yYWdlIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZCcsICgpID0+IHtcbiogICBjb25zdCBjdHggPSBuZXcgQ29udGVudFNjcmlwdENvbnRleHQoJ3Rlc3QnKTtcbiogICBjb25zdCBpdGVtID0gc3RvcmFnZS5kZWZpbmVJdGVtKCdsb2NhbDpjb3VudCcsIHsgZGVmYXVsdFZhbHVlOiAwIH0pO1xuKiAgIGNvbnN0IHdhdGNoZXIgPSB2aS5mbigpO1xuKlxuKiAgIGNvbnN0IHVud2F0Y2ggPSBpdGVtLndhdGNoKHdhdGNoZXIpO1xuKiAgIGN0eC5vbkludmFsaWRhdGVkKHVud2F0Y2gpOyAvLyBMaXN0ZW4gZm9yIGludmFsaWRhdGUgaGVyZVxuKlxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFdpdGgoMSwgMCk7XG4qXG4qICAgY3R4Lm5vdGlmeUludmFsaWRhdGVkKCk7IC8vIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGludmFsaWRhdGUgdGhlIGNvbnRleHRcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDIpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qIH0pO1xuKiBgYGBcbiovXG52YXIgQ29udGVudFNjcmlwdENvbnRleHQgPSBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG5cdHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiKTtcblx0aWQ7XG5cdGFib3J0Q29udHJvbGxlcjtcblx0bG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuXHRjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuXHRcdHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblx0XHR0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0XHR0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG5cdFx0dGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcblx0fVxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG5cdH1cblx0YWJvcnQocmVhc29uKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG5cdH1cblx0Z2V0IGlzSW52YWxpZCgpIHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lPy5pZCA9PSBudWxsKSB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0cmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG5cdH1cblx0Z2V0IGlzVmFsaWQoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmlzSW52YWxpZDtcblx0fVxuXHQvKipcblx0KiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXNcblx0KiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcblx0KiAgIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG5cdCogICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuXHQqICAgfSk7XG5cdCogICAvLyAuLi5cblx0KiAgIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcblx0KlxuXHQqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cblx0Ki9cblx0b25JbnZhbGlkYXRlZChjYikge1xuXHRcdHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdFx0cmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdH1cblx0LyoqXG5cdCogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb25cblx0KiB0aGF0IHNob3VsZG4ndCBydW4gYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuXHQqICAgICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuXHQqXG5cdCogICAgIC8vIC4uLlxuXHQqICAgfTtcblx0Ki9cblx0YmxvY2soKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHt9KTtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2Vsc1xuXHQqIHRoZSByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGVcblx0KiByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsSWRsZUNhbGxiYWNrYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0sIG9wdGlvbnMpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0YWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG5cdFx0fVxuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4odHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsIGhhbmRsZXIsIHtcblx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRzaWduYWw6IHRoaXMuc2lnbmFsXG5cdFx0fSk7XG5cdH1cblx0LyoqXG5cdCogQGludGVybmFsXG5cdCogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG5cdCovXG5cdG5vdGlmeUludmFsaWRhdGVkKCkge1xuXHRcdHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuXHRcdGxvZ2dlci5kZWJ1ZyhgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGApO1xuXHR9XG5cdHN0b3BPbGRTY3JpcHRzKCkge1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgeyBkZXRhaWw6IHtcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSB9KSk7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnM/Lm5vU2NyaXB0U3RhcnRlZFBvc3RNZXNzYWdlKSB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDQsNSw2LDddLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VhQSxJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFDWCxXQUFXOzs7Q0VIZixJQUFBLGtCQUFBLG9CQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpT0EsQ0FBQTs7O0NDaE9BLFNBQVNDLFFBQU0sUUFBUSxHQUFHLE1BQU07RUFFL0IsSUFBSSxPQUFPLEtBQUssT0FBTyxVQUFVLE9BQU8sU0FBUyxLQUFLLE1BQU0sS0FBSyxHQUFHLElBQUk7T0FDbkUsT0FB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