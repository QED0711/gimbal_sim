import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { invoke } from "@tauri-apps/api";

(async () => {
    // retrieve config before requiring any other part of the react/dom tree so we can load the config state into the window before initializing local state
    const initConfig = await invoke("retrieve_config") 
    window._initConfig = initConfig;

    const {default: App} = await import("./App");

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();

