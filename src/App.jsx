import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import mainManager, { mainPaths } from "./state/main/mainManager";
import { useSpiccatoState } from "spiccato-react";

import MapContainer from "./components/MapContainer";
import ControlsContainer from "./components/controls/ControlsContainer";
import OverlayHUD from "./components/OverlayHUD";
import useWindowResize from "./hooks/useWindowResize";

function App() {
  const size = useWindowResize();

  return (
    <div className="container">
      <MapContainer />
      <OverlayHUD />
      <ControlsContainer />
    </div>
  );
}


export default App;
