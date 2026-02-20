import { useSpiccatoState } from "spiccato-react";
import mainManager from "../../state/main/mainManager";
import { useEffect } from "react";

export default function GamepadManager() {
    const {state} = useSpiccatoState(mainManager, [mainManager.paths.gamepad]);

    useEffect(() => {
        if(state.gamepad) {
            console.log(state.gamepad.axes);
            const yawAxes = state.gamepad.axes[0];
            const pitchAxes = state.gamepad.axes[1];

            if(pitchAxes) {
                pitchAxes > 0
                    ? mainManager.setters.decreaseGimbalPitch(pitchAxes * -1)
                    : mainManager.setters.increaseGimbalPitch(pitchAxes )
            }
        }
    }, [state.gamepad])

    return <></>
}