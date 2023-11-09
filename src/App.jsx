import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import mainManager, { mainPaths } from "./state/main/mainManager";
import { useSpiccatoState } from "spiccato-react";

import {Viewer} from "cesium";
import MapContainer from "./components/MapContainer";
import ControlsContainer from "./components/controls/ControlsContainer";

function App() {
  const {state} = useSpiccatoState(mainManager, [mainPaths.name]);
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    mainManager.setters.setName(name);
    // setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    // const exec = async () => {
    //   setInterval(async () => {
    //     const output = await invoke("say_something_else", {s: "this is a test"});
    //     console.log(output)
    //   }, 2000)
    // }
    // exec();
  }, [])

  return (
    <div className="container">
      <MapContainer />
      <ControlsContainer />
    </div>
  );
}

export default App;
