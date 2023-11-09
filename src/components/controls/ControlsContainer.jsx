import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../../state/main/mainManager";

export default function ControlsContainer() {
    const {state} = useSpiccatoState(mainManager, [mainPaths.velocity]);

    return (
        <div className="fixed top-4 left-4">
            <button onClick={mainManager.setters.togglePause}>Play/Pause</button>
            <input type="number" value={state.velocity} onChange={e => mainManager.setters.setVelocity(parseInt(e.target.value))}/>
        </div>
    );
}
