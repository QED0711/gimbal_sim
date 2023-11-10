import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../../state/main/mainManager";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";

export default function ControlsContainer() {
    const { state } = useSpiccatoState(mainManager, [mainPaths.aircraft]);

    useKeyboardShortcuts();
    return (
        <div className="fixed top-4 left-4">
            <button onClick={mainManager.setters.togglePause}>Play/Pause</button>
            <input type="number" value={state.aircraft.velocity} onChange={e => mainManager.setters.setAircraft_velocity(parseInt(e.target.value))} />
            <div className="grid grid-cols-3 grid-rows-3">
                <div></div>
                <button onClick={() => { mainManager.methods.adjustPitch(1) }}>Up</button>
                <br/>
                <button onClick={() => { mainManager.methods.adjustPitch(1) }}>Left</button>
                <div></div>
                <button onClick={() => { mainManager.methods.adjustPitch(1) }}>Right</button>
                <div></div>
                <button onClick={() => { mainManager.methods.adjustPitch(-1) }}>Down</button>
                <div></div>
            </div>
        </div>
    );
}
