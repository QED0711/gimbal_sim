import "./App.css";

import useWindowResize from "./hooks/useWindowResize";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulatorContainer from "./components/simulator/SimulatorContainer";
import RoutePlannerContainer from "./components/routePlanner/RoutePlannerContainer";
import gamepadInit from './utils/gamepad';
import EventManager from "./components/managers/EventManager";
import GamepadManager from "./components/managers/GamepadManager";

gamepadInit();

function App() {
  const size = useWindowResize();

  return (
    <div className="container">
      <EventManager />
      {/* <GamepadManager /> */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SimulatorContainer />} />
          <Route path="/route-planner" element={<RoutePlannerContainer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}


export default App;
