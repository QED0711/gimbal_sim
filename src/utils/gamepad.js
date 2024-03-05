import "tauri-plugin-gamepad-api";
import mainManager from "../state/main/mainManager";

export default function init() {
    // loop();
    console.log("GAMEPAD INIT")
    setInterval(() => {
        const gamepad = navigator.getGamepads?.()?.[0];
        if(gamepad) {
            // console.log(gamepad.buttons.map(button => button.value));
            const yawAxes = gamepad.axes[1];
            const pitchAxes = gamepad.axes[2];
            const zoomAxes = gamepad.axes[3];

            if(yawAxes) {
                yawAxes > 0
                    ? mainManager.setters.increaseGimbalHeading(yawAxes)
                    : mainManager.setters.decreaseGimbalHeading(yawAxes * -1)
            }

            if(pitchAxes) {
                pitchAxes > 0
                    ? mainManager.setters.decreaseGimbalPitch(pitchAxes)
                    : mainManager.setters.increaseGimbalPitch(pitchAxes * -1)
            }

            if(zoomAxes) {
                zoomAxes > 0 
                    ? mainManager.setters.adjustGimbalZoom(zoomAxes * -1)
                    : mainManager.setters.adjustGimbalZoom(zoomAxes * -1)
            }

            // mainManager.setters.setGamepad(gamepad);
        }
    }, 25)

}