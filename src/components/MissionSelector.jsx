// ============================= STATE ============================= 
import { useSpiccatoState } from "spiccato-react"
import mainManager from "../state/main/mainManager"

export default function MissionSelector() {
    // STATE
    const { state } = useSpiccatoState(mainManager, [mainManager.paths.missions, mainManager.paths.selectedMissionIndex])
    
    // EVENTS
    const handleMissionChange = e => {
        mainManager.setters.changeSelectedMission(parseInt(e.target.value));
        console.log(e.target)
        e.target.blur();
    }
    // RENDERERS
    const renderMissionOptions = (missions) => {
        return missions.map((mission, i) => (
            <option key={i} value={i} >{mission.name}</option>
        ))
    }

    return (
        <div className="fixed bottom-1 right-1 z-50">
            <select className="cursor-pointer font-bold" value={state.selectedMissionIndex} onChange={handleMissionChange}>
                {renderMissionOptions(state.missions)}
            </select>
        </div>
    )
}