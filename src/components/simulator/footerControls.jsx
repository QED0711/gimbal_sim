// ============================= STATE ============================= 
import { useSpiccatoState } from "spiccato-react"
import mainManager from "../../state/main/mainManager"
import { betweenRange } from "../../utils/general";

export default function FooterControls() {
    // STATE
    const { state } = useSpiccatoState(
        mainManager, [
            mainManager.paths.missions, 
            mainManager.paths.selectedMissionIndex,
            mainManager.paths.aircraft,
        ])

    // EVENTS
    const handleHeadingChange = e => {
        let val = parseFloat(e.target.value);
        val = betweenRange(val, -1, 360);
        if(val === -1) val = 359;
        if(val === 360) val = 0;
        mainManager.setters.setAircraft_heading(val)
    }

    const handlePitchChange = e => {
        let val = parseFloat(e.target.value);
        val = betweenRange(val, -90, 90);
        mainManager.setters.setAircraft_pitch(val)
    }

    const handleSpeedChange = e => {
        let val = parseFloat(e.target.value);
        val = betweenRange(val, 0, 9999);
        mainManager.setters.setAircraft_velocity(val / 2.23694) // convert to meters per second
    }

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
        <>
            <div className="fixed bottom-1 left-1 z-50 grid grid-cols-3 gap-2 p-1 rounded-md bg-gray-400">
                <label className="w-16" onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
                    <p className="text-sm font-bold">Heading</p>
                    <input className="px-1 w-full rounded-sm" type="number" value={state.aircraft.heading} onChange={handleHeadingChange} min={-1} max={360}/>
                </label>
                <label className="w-16" onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
                    <p className="text-sm font-bold">Pitch</p>
                    <input className="px-1 w-full rounded-sm" type="number" value={state.aircraft.pitch} onChange={handlePitchChange} min={-90} max={90}/>
                </label>
                <label className="w-16" onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
                    <p className="text-sm font-bold">Speed</p>
                    <input className="px-1 w-full rounded-sm" type="number" value={state.aircraft.velocity * 2.23694} onChange={handleSpeedChange} step={1} min={0} max={9999}/>
                </label>
            </div>

            <div className="fixed bottom-1 right-1 z-50">
                <select className="cursor-pointer font-bold" value={state.selectedMissionIndex} onChange={handleMissionChange}>
                    {renderMissionOptions(state.missions)}
                </select>
            </div>

        </>
    )
}