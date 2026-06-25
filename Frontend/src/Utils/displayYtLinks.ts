interface VideoItem {
    id: string;
    title: string;
    channel: string;
    duration: string;
    views: string;
    publishedAt: string;
}

let injectedForSlug = "";

function waitForSolutionsPane(timeout = 10000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
        const find = (): HTMLElement | null => {
            // The solutions pane uniquely has a search input with placeholder "Search..."
            const input = document.querySelector<HTMLInputElement>('input[placeholder="Search..."]');
            if (!input) return null;
            // Walk up to the closest overflow-auto ancestor — that's the scroll container
            let el: HTMLElement | null = input.parentElement;
            while (el && el !== document.body) {
                if (el.classList.contains("overflow-auto")) return el;
                el = el.parentElement;
            }
            return null;
        };

        const found = find();
        if (found) return resolve(found);

        const timer = setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
        const observer = new MutationObserver(() => {
            const el = find();
            if (el) { clearTimeout(timer); observer.disconnect(); resolve(el); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function isDark(): boolean {
    return !!document.querySelector("html.dark") || !!document.querySelector("body.chakra-ui-dark");
}

function getProblemSlug(): string | null {
    const match = location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
}

function buildVideoCard(video: VideoItem, dark: boolean): string {
    const subColor = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
    const titleColor = dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";
    const safeTitle = video.title.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const channelSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.channel)}`;
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;

    return `
<div class="lvs-card" style="min-width:100%;display:flex;flex-direction:column;padding:4px 8px 12px;">
  <div style="display:flex;gap:16px;align-items:flex-start;">
    <div class="lvs-thumb-wrap" data-videoid="${video.id}" data-title="${safeTitle}"
         style="flex:0 0 65%;position:relative;cursor:pointer;background:#000;border-radius:6px;overflow:hidden;">
      <img src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg"
           style="width:100%;display:block;opacity:0.85;" alt="${safeTitle}" />
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <svg width="52" height="52" viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>
          <path d="M45 24 27 14v20" fill="#fff"/>
        </svg>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;color:${subColor};padding-top:4px;">
      <span style="display:flex;align-items:center;gap:6px;font-size:13px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${video.duration}
      </span>
      <span style="display:flex;align-items:center;gap:6px;font-size:13px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        ${video.views}
      </span>
      <span style="display:flex;align-items:center;gap:6px;font-size:13px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${video.publishedAt}
      </span>
      <span style="display:flex;align-items:center;gap:5px;font-size:13px;">
        by <a href="${channelSearch}" target="_blank" style="color:#40a9ff;text-decoration:none;">${video.channel}</a>
      </span>
      <a href="${watchUrl}" target="_blank"
         style="display:flex;align-items:center;gap:5px;font-size:12px;color:${subColor};text-decoration:none;margin-top:2px;">
        Watch on YouTube
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
    </div>
  </div>
  <p style="margin:8px 0 0;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${titleColor};">
    ${safeTitle}
  </p>
</div>`;
}

function attachThumbClickHandlers(container: Element) {
    container.querySelectorAll<HTMLElement>(".lvs-thumb-wrap").forEach((wrap) => {
        wrap.addEventListener("click", () => {
            const id = wrap.dataset.videoid!;
            const title = wrap.dataset.title || "Play";
            const iframe = document.createElement("iframe");
            iframe.width = "100%";
            iframe.style.cssText = "aspect-ratio:16/9;border:0;border-radius:6px;";
            iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&modestbranding=1&rel=0`;
            iframe.title = title;
            wrap.replaceWith(iframe);
        }, { once: true });
    });
}

function renderVideoSection(container: HTMLElement, videos: VideoItem[]) {
    if (!videos.length) {
        container.innerHTML = `<p style="padding:12px 0;color:gray;font-size:13px;">No videos found for this problem.</p>`;
        return;
    }

    const dark = isDark();
    const btnBg = dark ? "#282828" : "#ffffff";
    const btnColor = dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";

    const cardsHTML = videos.map(v => buildVideoCard(v, dark)).join("");

    container.innerHTML = `
<div style="position:relative;">
  <button class="lvs-prev"
    style="position:absolute;left:0;top:38%;z-index:10;background:${btnBg};border:1px solid rgba(128,128,128,0.2);
           border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;
           cursor:pointer;color:${btnColor};padding:0;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  </button>
  <div class="lvs-scroll" style="display:flex;overflow:hidden;scroll-behavior:smooth;">
    ${cardsHTML}
  </div>
  <button class="lvs-next"
    style="position:absolute;right:0;top:38%;z-index:10;background:${btnBg};border:1px solid rgba(128,128,128,0.2);
           border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;
           cursor:pointer;color:${btnColor};padding:0;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  </button>
</div>`;

    const scroll = container.querySelector<HTMLElement>(".lvs-scroll")!;
    container.querySelector(".lvs-prev")?.addEventListener("click", () => {
        scroll.scrollLeft -= scroll.clientWidth;
    });
    container.querySelector(".lvs-next")?.addEventListener("click", () => {
        scroll.scrollLeft += scroll.clientWidth;
    });

    attachThumbClickHandlers(container);
}

export default async function displayYtLinks() {
    const url = location.href;
    if (!url.includes("/problems/")) return;

    const slug = getProblemSlug();
    if (!slug) return;

    // Already injected and still in DOM
    if (injectedForSlug === slug && document.querySelector(".lvs-video-section")) return;

    // Remove stale section from previous problem
    document.querySelector(".lvs-video-section")?.remove();
    injectedForSlug = slug;

    // Wait for the solutions pane scroll container (identified by its Search... input)
    const solutionsArea = await waitForSolutionsPane();
    if (!solutionsArea) return;
    if (solutionsArea.querySelector(".lvs-video-section")) return;

    // Resolve problem title
    const titleEl =
        document.querySelector<HTMLElement>(`a[href='/problems/${slug}/']`) ||
        document.querySelector<HTMLElement>("a.mr-2.text-label-1");
    const rawTitle = titleEl?.textContent || "";
    const problemTitle = rawTitle.includes(".")
        ? rawTitle.split(".").slice(1).join(".").trim()
        : slug.replace(/-/g, " ");

    // Build section skeleton
    const section = document.createElement("div");
    section.className = "lvs-video-section";
    section.style.cssText = "padding:12px 0 8px;border-bottom:1px solid var(--border-primary,rgba(128,128,128,0.2));margin-bottom:8px;";

    section.innerHTML = `
<div style="display:flex;align-items:center;gap:8px;padding:0 8px 6px;">
  <h2 style="font-size:18px;font-weight:500;margin:0;">Video Solutions</h2>
</div>
<div style="font-size:12px;font-style:italic;color:gray;padding:0 8px 8px;">
  Tip: You can scroll horizontally
</div>
<div class="lvs-cards-container" style="padding:0 4px;">
  <p style="color:gray;font-size:13px;padding:0 4px;">Loading videos…</p>
</div>`;

    solutionsArea.insertBefore(section, solutionsArea.firstChild);

    const cardsContainer = section.querySelector<HTMLElement>(".lvs-cards-container")!;

    try {
        const videos = await browser.runtime.sendMessage({
            type: "youtube-search",
            question: problemTitle,
        }) as VideoItem[];

        renderVideoSection(cardsContainer, videos || []);
    } catch {
        cardsContainer.innerHTML = `<p style="color:gray;font-size:13px;padding:0 4px;">Failed to load videos. Make sure the backend is running.</p>`;
    }
}
