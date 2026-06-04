import { useRef, useEffect } from 'react';
import { browser } from 'wxt/browser';
import './App.css';

function App() {

    const showWarning = useRef<HTMLInputElement>(null);
    const showNA = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load1() {
            let data = (await browser.storage.local.get("showWarning")).showWarning;
            if (data === undefined) data = true;

            if (showWarning.current) {
                showWarning.current.checked = data as boolean;
                showWarning.current.addEventListener("change", async (e) => {
                    await browser.storage.local.set({ showWarning: (e.target as HTMLInputElement).checked });
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
                });
            }
        }

        load1();
        load2();
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
        </>
    );
}

export default App;
