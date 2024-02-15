// ============================= STATE ============================= 
import { useSpiccatoState } from "spiccato-react"
import mainManager from "../../state/main/mainManager"
import { betweenRange } from "../../utils/general";
import { useEffect } from "react";

export default function FooterControls() {
    // STATE
    const { state } = useSpiccatoState(
        mainManager, [
            mainManager.paths.missions, 
            mainManager.paths.selectedMissionIndex,
            mainManager.paths.aircraft,
            mainManager.paths.orbit,
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

    const handleOrbitTypeChange = e => {
        mainManager.setters.setOrbit_type(e.target.value);
    }

    const handleOrbitRateChange = e => {
        let val = parseFloat(e.target.value);
        if(!isNaN(val)) {
            mainManager.setters.setOrbit_rate(val * 1000);
        }
    }

    const handleMissionChange = e => {
        mainManager.setters.changeSelectedMission(parseInt(e.target.value));
        e.target.blur();
    }

    // RENDERERS
    const renderMissionOptions = (missions) => {
        return missions.map((mission, i) => (
            <option key={i} value={i} >{mission.name}</option>
        ))
    }

    // EFFECTS
    useEffect(() => {
        clearInterval(window._orbitInterval);
        window._orbitInterval = setInterval(() => {
            const orbitType = mainManager.getters.getOrbit_type();
            switch(orbitType) {
                case "clockwise":
                    mainManager.setters.increaseAircraftHeading(1);
                    break;
                case "counter-clockwise":
                    mainManager.setters.decreaseAircraftHeading(1);
                    break;
            }
        }, state.orbit.rate)
    }, [state.orbit])

    return (
        <>
            <div className="fixed bottom-1 left-1 z-50 grid grid-cols-3 gap-2 p-1 rounded-md bg-gray-300">
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
                <hr className="col-span-3"/>
                <label className="col-span-2" onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
                    <p className="text-sm font-bold">Orbit</p>
                    <select value={state.orbit.type} onChange={handleOrbitTypeChange}>
                        <option value="no-orbit">No Orbit</option>
                        <option value="clockwise">Clockwise</option>
                        <option value="counter-clockwise">Counter-Clockwise</option>
                    </select>
                </label>

                <label className="col-span-1 w-16" onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
                    <p className="text-sm font-bold">Size</p>
                    <input className="px-1 w-full rounded-sm" type="number" value={state.orbit.rate / 1000} onChange={handleOrbitRateChange} step={0.1} min={0.1} />
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