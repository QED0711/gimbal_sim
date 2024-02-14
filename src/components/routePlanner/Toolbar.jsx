// ============================= iCONS ============================= 
import { FaLocationCrosshairs, FaLocationDot } from "react-icons/fa6";
import plannerManager from "../../state/planner/plannerManager";

export default function Toolbar() {

    // EVENTS
    const handleFindAircraftClick = () => {
        plannerManager.methods.zoomToAircraft();
    }

    return (
        <div className="fixed top-2 left-2 w-fit">

            <button 
                className="block p-1 my-1 rounded-sm border-2 border-solid border-black cursor-pointer" 
                title="find aircraft"
                onClick={handleFindAircraftClick}
            >
                <FaLocationCrosshairs size={"2rem"} />
            </button>

            <button 
                className="block p-1 my-1 rounded-sm border-2 border-solid border-black cursor-pointer" 
                title="place waypoint"
            >
                <FaLocationDot size={"2rem"} />
            </button>

        </div>
    )
}