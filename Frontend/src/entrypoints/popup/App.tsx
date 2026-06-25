import { useRef, useEffect } from 'react';
import { browser } from 'wxt/browser';
import './App.css';

function App() {

    const showWarning = useRef<HTMLInputElement>(null);
    const showNA = useRef<HTMLInputElement>(null);
    const showYtSolutions = useRef<HTMLInputElement>(null);
    const showCopyButton = useRef<HTMLInputElement>(null);

    const reloadActiveTab = async () => {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) browser.tabs.reload(tab.id);
    };

    useEffect(() => {
        async function load1() {
            let data = (await browser.storage.local.get("showWarning")).showWarning;
            if (data === undefined) data = true;

            if (showWarning.current) {
                showWarning.current.checked = data as boolean;
                showWarning.current.addEventListener("change", async (e) => {
                    await browser.storage.local.set({ showWarning: (e.target as HTMLInputElement).checked });
                    await reloadActiveTab();
                });
            }
        }

        async function load2() {
            let data = (await browser.storage.local.get("showNA")).showNA;
            if (data === undefined) data = false;

            if (showNA.current) {
                showNA.current.checked = data as boolean;
                showNA.current.addEventListener("change", async (e) => {
                    await browser.storage.local.set({ showNA: (e.target as HTMLInputElement).checked });
                    await reloadActiveTab();
                });
            }
        }

        async function load3() {
            let data = (await browser.storage.local.get("showYtSolutions")).showYtSolutions;
            if (data === undefined) data = true;

            if (showYtSolutions.current) {
                showYtSolutions.current.checked = data as boolean;
                showYtSolutions.current.addEventListener("change", async (e) => {
                    await browser.storage.local.set({ showYtSolutions: (e.target as HTMLInputElement).checked });
                    await reloadActiveTab();
                });
            }
        }

        async function load4() {
            let data = (await browser.storage.local.get("showCopyButton")).showCopyButton;
            if (data === undefined) data = true;

            if (showCopyButton.current) {
                showCopyButton.current.checked = data as boolean;
                showCopyButton.current.addEventListener("change", async (e) => {
                    await browser.storage.local.set({ showCopyButton: (e.target as HTMLInputElement).checked });
                    await reloadActiveTab();
                });
            }
        }

        load1();
        load2();
        load3();
        load4();
    }, []);

    return (
        <>
            <div style={{ display: "flex" }}>
                <label htmlFor='showWarningInput'>
                    Show Warning Before Rating
                </label>
                <input ref={showWarning} id='showWarningInput' defaultChecked type='checkbox' />
            </div>

            <hr/>

            <div style={{ display: "flex" }}>
                <label htmlFor='showNAInput'>
                    Show N/A if no rating is available
                </label>
                <input ref={showNA} id='showNAInput' type='checkbox' />
            </div>

            <hr/>

            <div style={{ display: "flex" }}>
                <label htmlFor='showYtSolutionsInput'>
                    Show YouTube Solutions
                </label>
                <input ref={showYtSolutions} id='showYtSolutionsInput' defaultChecked type='checkbox' />
            </div>

            <hr/>

            <div style={{ display: "flex" }}>
                <label htmlFor='showCopyButtonInput'>
                    Show Copy Code Button
                </label>
                <input ref={showCopyButton} id='showCopyButtonInput' defaultChecked type='checkbox' />
            </div>
        </>
    );
}

export default App;
