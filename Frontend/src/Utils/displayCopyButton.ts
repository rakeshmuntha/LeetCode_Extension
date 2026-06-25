export default function displayCopyButton() {


    // Reuse existing popup across re-runs (URL navigation)
    let popup = document.getElementById('lc-copy-popup') as HTMLDivElement | null;
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'lc-copy-popup';
    } else {
        // Popup already set up — only need to (re-)attach the button
        popup.style.display = "none";
    }
    popup.innerHTML = `<div role="region" aria-label="Notifications (F8)" tabindex="-1" style=""><span aria-hidden="true" tabindex="0" style="position: fixed; border: 0px; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; overflow-wrap: normal;"></span><ol tabindex="-1" class="pointer-events-none fixed flex max-h-screen w-full flex-col-reverse items-center gap-4 p-4 z-message left-0 top-0"><li role="status" aria-live="off" aria-atomic="true" tabindex="0" data-state="open" data-swipe-direction="up" class="group sd-sm:max-w-[600px] max-w-full pointer-events-auto relative flex items-center justify-between gap-2 bg-sd-popover text-sd-foreground overflow-hidden rounded-sd-md border border-sd-border py-1.5 px-4 shadow-md transition data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-24 data-[state=open]:slide-in-from-top-24" data-radix-collection-item="" style="user-select: none; touch-action: none;" data-swipe="cancel"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-check" class="svg-inline--fa fa-circle-check h-4 w-4 text-sd-success mt-0.5 self-start" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path></svg><div class="grid gap-1"><div class="text-sm font-semibold [&amp;+div]:text-xs">Question Copied!</div></div></li></ol><span aria-hidden="true" tabindex="0" style="position: fixed; border: 0px; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; overflow-wrap: normal;"></span></div>
    `

    popup.style.display = "none";

    if (!document.getElementById('lc-copy-popup')) {
        document.getElementById('__next')?.append(popup);
    }


    const MAIN_COLOR = "#ffffff";
    const ALT_COLOR = "transparent";
    const POPUP_SHOW_TIME = 2000;
    const WAIT_TIME = 100;

    const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide  lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

    const showPopup = () => {
        popup.style.display = "block";
        setTimeout(() => {
            popup.style.display = "none";
        }, POPUP_SHOW_TIME);
    };

    const copyText = (targetObj: { titleDom: HTMLElement; descriptionDom: HTMLElement }) => {
        // Get the current URL.
        const url = window.location.href;

        // Try to find the elements for the old version of the website.
        let title;
        let descriptionContent;
        let text;

        // Get title
        title = targetObj.titleDom.innerText;

        // Get main problem description
        descriptionContent = targetObj.descriptionDom;

        // Clean the content to be copied
        text = descriptionContent.textContent.replace(/(\n){2,}/g, "\n\n").trim();

        // Create a hidden textarea element.
        const hiddenElement = document.createElement("textarea");

        // Format the plain text string and add the title and URL.
        const value = `URL: ${url}\n\n${title}\n\n${text}`;

        // Set the value of the hidden textarea element.
        hiddenElement.value = value;
        // Add the element to the document.
        document.body.appendChild(hiddenElement);
        // Select the text in the element.
        hiddenElement.select();
        // Copy the text.
        document.execCommand("copy");
        // Remove the hidden element from the document.
        document.body.removeChild(hiddenElement);
    };

    // Set a timeout to give the page time to load before adding the buttons.
    setTimeout(() => {
        // Target Layouts
        const TARGETS = [
            {
                name: "originalLayout",
                titleDom: document.querySelector("[data-cy=question-title]"),
                descriptionDom: document.querySelector(
                    "[data-track-load=description_content]"
                ),
                useStyle: true,
                style: `
        position: absolute;
        top: 1rem;
        right: 0;
        display: flex;
      `,
                classList: [],
            },
            {
                name: "newLayout",
                titleDom: document.querySelector(
                    ".mr-2.text-lg.font-medium.text-label-1.dark\\:text-dark-label-1"
                ),
                descriptionDom: document.querySelector(
                    "[data-track-load=description_content]"
                ),
                useStyle: false,
                style: "",
                classList: [
                    "mt-1",
                    "inline-flex",
                    "min-h-20px",
                    "items-center",
                    "space-x-2",
                    "align-top",
                ],
            },
            {
                name: "contestLayout",
                titleDom: document.querySelector(
                    "#base_content > div.container > div > div > div.question-title.clearfix > h3"
                ),
                descriptionDom: document.querySelector(
                    "div.question-content.default-content"
                ),
                useStyle: true,
                style: `display: flex;`,
                classList: [],
            },
            {
                name: "dynamicLayout",
                titleDom: document.querySelector(
                    ".text-title-large a.no-underline.cursor-text"
                ),
                descriptionDom: document.querySelector(
                    "[data-track-load=description_content]"
                ),
                useStyle: true,
                style: `display: inline-flex; align-items: center;`,
                classList: [],
            },
        ];

        // Determine which target layout.
        let target: HTMLElement | null;

        // Create a container for the buttons.
        const buttonContainer = document.createElement("div");
        buttonContainer.setAttribute('data-lc-copy', 'true');

        // Filter target DOM that is not null
        const filteredTarget = TARGETS.filter(
            (
                t
            ): t is typeof t & {
                titleDom: HTMLElement;
                descriptionDom: HTMLElement;
            } => t.titleDom instanceof HTMLElement && t.descriptionDom instanceof HTMLElement
        );

        const targetObject = filteredTarget[0];
        if (!targetObject) {
            return;
        }

        target = targetObject.titleDom;

        // Style button by layout
        if (targetObject.useStyle) {
            buttonContainer.style = targetObject.style;
        } else {
            targetObject.classList.forEach((i) => buttonContainer.classList.add(i));
        }

        if (target) {
            // Skip if copy button is already attached to this exact title element
            if (target.nextElementSibling?.getAttribute('data-lc-copy') === 'true') {
                return;
            }

            const parent = target.parentElement;
            if (!parent) {
                return;
            }

            // Set the base style for the buttons.
            const buttonStyle = `
      margin-right: 1rem;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${MAIN_COLOR};
      background: ${ALT_COLOR};
      border: none;
      cursor: pointer;
      text-align: center;
      opacity: 1;
      transition: opacity 0.2s;
    `;

            // Add copy button to the container.
            const buttons = ["copy"];
            buttons.forEach((button) => {
                const _button = document.createElement("button");
                // Styling.
                _button.type = "button";
                _button.setAttribute("aria-label", "Copy problem");
                _button.innerHTML = COPY_ICON;
                _button.style = buttonStyle;

                // Event listeners.
                _button.addEventListener("click", () => {
                    copyText(targetObject);
                    showPopup();
                });

                _button.addEventListener("mouseenter", () => {
                    _button.style.opacity = "0.5";
                });

                _button.addEventListener("mouseleave", () => {
                    _button.style.opacity = "1";
                });

                // Add the button to the button container.
                buttonContainer.append(_button);
            });

            // Insert the button container right after the title element.
            target.insertAdjacentElement("afterend", buttonContainer);
        }
    }, WAIT_TIME);

}
