import { useEffect } from "react"
import { useSpiccatoState } from "spiccato-react"
import mainManager from "../../state/main/mainManager"
import { emit } from "@tauri-apps/api/event";

export default function FlightManager(){
    const {state}  = useSpiccatoState(mainManager, [
        mainManager.paths.position,
        mainManager.paths.aircraft,
    ]);

    useEffect(() => {
        emit("positionUpdate", state.position)
    }, [state.position] )

    useEffect(() => {
        emit("aircraftUpdate", state.aircraft)
    }, [state.aircraft] )

    return <></>
}