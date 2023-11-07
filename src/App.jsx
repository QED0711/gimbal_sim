import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import mainManager, { mainPaths } from "./state/main/mainManager";
import { useSpiccatoState } from "spiccato-react";

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
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{state.name}</p>
    </div>
  );
}

export default App;
