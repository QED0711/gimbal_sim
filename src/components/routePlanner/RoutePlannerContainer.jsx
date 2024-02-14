import { useEffect } from "react";

// ============================= STATE ============================= 
import plannerManager from "../../state/planner/plannerManager";

// ============================= COMPONENTS ============================= 
import RouteMap from "./RouteMap";
import Toolbar from "./Toolbar";

export default function RoutePlannerContainer() {
    

    return (

        <>
            <RouteMap />
            <Toolbar />
        </>

    )
}