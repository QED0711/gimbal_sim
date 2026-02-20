// ============================= iCONS ============================= 
import plannerManager from "../../state/planner/plannerManager";
import { useSpiccatoState } from "spiccato-react";
import { FaLocationCrosshairs, FaLocationDot, FaArrowRotateLeft,  FaArrowRotateRight } from "react-icons/fa6";
import { emit } from "@tauri-apps/api/event";

export default function Toolbar() {

    const {state} = useSpiccatoState(plannerManager, [plannerManager.paths.mapMode, plannerManager.paths.orbit]);

    // EVENTS
    const handleFindAircraftClick = () => {
        plannerManager.methods.zoomToAircraft();
    }

    const handleWaypointClick = () => {
        if(state.mapMode !== "waypoint"){
            plannerManager.setters.setMapMode("waypoint");
        } else {
            plannerManager.setters.setMapMode("drag");
        }
    }    
    const handleWaypointRightClick = e => {
        e.preventDefault(); 
        plannerManager.setters.setHeadingWaypoint(null)
    }

    const handleClockwiseOrbitClick = () => {
        if(state.orbit.type === "clockwise") {
            plannerManager.setters.setOrbit_type("no-orbit");
            emit("orbitTypeChange", "no-orbit")
        } else {
            plannerManager.setters.setOrbit_type("clockwise");
            emit("orbitTypeChange", "clockwise")
        }
    }

    const handleCounterClockwiseOrbitClick = () => {
        if(state.orbit.type === "counter-clockwise") {
            plannerManager.setters.setOrbit_type("no-orbit");
            emit("orbitTypeChange", "no-orbit")
        } else {
            plannerManager.setters.setOrbit_type("counter-clockwise");
            emit("orbitTypeChange", "counter-clockwise")
        }
    }

    return (
        <div className="fixed top-0 left-0 w-fit bg-gray-100 shadow-md shadow-gray-800">

            <div 
                className="block py-1 px-2 cursor-pointer hover:bg-gray-300" 
                title="find aircraft"
                onClick={handleFindAircraftClick}
            >
                <FaLocationCrosshairs size={"2rem"} />
            </div>

            <div 
                className={`block py-1 px-2 my-1 cursor-pointer ${state.mapMode === "waypoint" ? "" : "hover:bg-gray-300"} ${state.mapMode === "waypoint" ? "bg-cyan-400" : "bg-transparent"}`}
                title="place waypoint"
                onClick={handleWaypointClick}
                onContextMenu={handleWaypointRightClick}
            >
                <FaLocationDot size={"2rem"} />
            </div>

            <div 
                className={`block py-1 px-2 my-1 cursor-pointer ${state.orbit.type === "clockwise" ? "" : "hover:bg-gray-300"} ${state.orbit.type === "clockwise" ? "bg-cyan-400" : "bg-transparent"}`}
                title="clockwise orbit"
                onClick={handleClockwiseOrbitClick}
            >
                <FaArrowRotateRight size={"2rem"} />
            </div>

            <div 
                className={`block py-1 px-2 my-1 cursor-pointer ${state.orbit.type === "counter-clockwise" ? "" : "hover:bg-gray-300"} ${state.orbit.type === "counter-clockwise" ? "bg-cyan-400" : "bg-transparent"}`}
                title="counter-clockwise orbit"
                onClick={handleCounterClockwiseOrbitClick}
            >
                <FaArrowRotateLeft size={"2rem"} />
            </div>

        </div>
    )
}