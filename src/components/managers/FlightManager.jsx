import { useEffect } from "react"
import { useSpiccatoState } from "spiccato-react"
import mainManager from "../../state/main/mainManager"
import { emit } from "@tauri-apps/api/event";

export default function FlightManager(){
    const {state}  = useSpiccatoState(mainManager, [mainManager.paths.position]);

    useEffect(() => {
        emit("positionUpdate", state.position)
    }, [state.position] )

    return <></>
}