import "tauri-plugin-gamepad-api";
import mainManager from "../state/main/mainManager";
import { CONTROLLER_TYPE } from "./general";

const getMomentaryButton = (gamepad, idx, name) => {
    const value = (window[name] !== undefined && window[name] !== gamepad.buttons[idx].value)
        ? gamepad.buttons[idx].value
        : 0

        window[name] = gamepad.buttons[idx].value;
        return value
}

export default function init() {
    // loop();
    console.log("GAMEPAD INIT")
    setInterval(() => {
        const gamepads = navigator.getGamepads?.() ?? [];
        const gamepadType = mainManager.getters.getGamepadType();

        for (const [gpIdx, gamepad] of Object.entries(gamepads)) {
            if (!gamepad) return;

            gamepad.buttons.forEach((button, i) => {if(button.value !== 0) console.log(`${gpIdx}: BUTTON ${i}:`, button.value)});
            gamepad.axes.forEach((axis, i) => {if(axis !== 0) console.log(`${gpIdx}: AXIS ${i}:`, axis)});

            let yawAxes = 0, pitchAxes = 0, zoomAxes = 0, toggleLock = 0;
            switch (gamepadType) {
                case CONTROLLER_TYPE.CONTROLLER:
                    yawAxes = gamepad.axes[4];
                    pitchAxes = gamepad.axes[5] * -1;
                    zoomAxes = gamepad.axes[2] * -1;
                    toggleLock = getMomentaryButton(gamepad, 15, "toggleLock");
                    // toggleLock = (window.prevToggleLock !== undefined && window.prevToggleLock !== gamepad.buttons[15].value) 
                    //     ? gamepad.buttons[15].value
                    //     : 0
                    // window.prevToggleLock = gamepad.buttons[15].value;
                    break;
                case CONTROLLER_TYPE.JOYSTICK:
                    yawAxes = gamepad.axes[1];
                    pitchAxes = gamepad.axes[2];
                    zoomAxes = gamepad.axes[3];
                    break;
            }


            if (yawAxes) {
                yawAxes > 0
                    ? mainManager.setters.increaseGimbalHeading(yawAxes)
                    : mainManager.setters.decreaseGimbalHeading(yawAxes * -1)
            }

            if (pitchAxes) {
                pitchAxes > 0
                    ? mainManager.setters.decreaseGimbalPitch(pitchAxes)
                    : mainManager.setters.increaseGimbalPitch(pitchAxes * -1)
            }

            if (zoomAxes) {
                zoomAxes > 0
                    ? mainManager.setters.adjustGimbalZoom(zoomAxes * -1)
                    : mainManager.setters.adjustGimbalZoom(zoomAxes * -1)
            }

            if(toggleLock) {
                mainManager.setters.toggleGimbalLock();
            }
        }
    }, 25)

}