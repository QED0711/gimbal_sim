import "./App.css";

import useWindowResize from "./hooks/useWindowResize";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulatorContainer from "./components/simulator/SimulatorContainer";
import RoutePlannerContainer from "./components/routePlanner/RoutePlannerContainer";
import EventManager from "./components/managers/EventManager";

function App() {
  const size = useWindowResize();

  return (
    <div className="container">
      <EventManager />
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
