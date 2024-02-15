import { useEffect } from "react";

// ============================= TAURI ============================= 
import { emit } from "@tauri-apps/api/event";

// ============================= STATE ============================= 
import plannerManager from "../../state/planner/plannerManager";

// ============================= COMPONENTS ============================= 
import RouteMap from "./RouteMap";
import Toolbar from "./Toolbar";

export default function RoutePlannerContainer() {
    
    useEffect(() => {
        emit("initRequest");
    }, [])

    return (

        <>
            <RouteMap />
            <Toolbar />
        </>

    )
}