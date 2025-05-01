import "tauri-plugin-gamepad-api";
import mainManager from "../state/main/mainManager";
import { GAMEPAD_TYPE } from "./general";

window._missionSwapCount = -1;

const buttonStates = {}
const getMomentaryButton = (gamepad, idx, name) => {
    if (!(name in buttonStates)) {
        buttonStates[name] = 0;
    }

    const value = (buttonStates[name] !== gamepad.buttons[idx].value)
        ? gamepad.buttons[idx].value
        : 0;

    buttonStates[name] = gamepad.buttons[idx].value;
    return value;
}

export default function init() {
    // loop();
    console.log("GAMEPAD INIT")
    setInterval(() => {
        const gamepads = navigator.getGamepads?.() ?? [];
        const gamepadType = mainManager.getters.getGamepadType();

        for (const [gpIdx, gamepad] of Object.entries(gamepads)) {
            if (!gamepad) return;

            // gamepad.buttons.forEach((button, i) => { if (button.value !== 0 && window.developmentMode) console.log(`${gpIdx}: BUTTON ${i}:`, button.value) });
            // gamepad.axes.forEach((axis, i) => { if (axis !== 0 && window.developmentMode) console.log(`${gpIdx}: AXIS ${i}:`, axis) });

            let yawAxes = 0,
                pitchAxes = 0,
                zoomAxes = 0,
                toggleLock = 0,
                toggleCameraType = 0,
                missionSwap = 0,
                toggleMovers = 0;
            switch (gamepadType) {
                case GAMEPAD_TYPE.CONTROLLER:
                    yawAxes = gamepad.axes[window._initConfig?.gamepad_layout?.yaw_axis ?? -1];
                    pitchAxes = gamepad.axes[window._initConfig?.gamepad_layout?.pitch_axis ?? -1] * -1;
                    zoomAxes = gamepad.axes[window._initConfig?.gamepad_layout?.zoom_axis ?? -1] * -1;
                    toggleLock = getMomentaryButton(gamepad, window._initConfig?.gamepad_layout?.lock_button ?? -1, "toggleLock");
                    toggleCameraType = getMomentaryButton(gamepad, window._initConfig?.gamepad_layout?.camera_type_button ?? -1, "toggleCameraType")
                    missionSwap = getMomentaryButton(gamepad, window._initConfig?.gamepad_layout?.mission_swap_button ?? -1, "missionSwapper")
                    toggleMovers = getMomentaryButton(gamepad, window._initConfig?.gamepad_layout?.toggle_movers ?? -1, "toggleMovers")
                    break;
                case GAMEPAD_TYPE.JOYSTICK:
                    yawAxes = gamepad.axes[1];
                    pitchAxes = gamepad.axes[2];
                    zoomAxes = gamepad.axes[3];
                    break;
            }


            if (yawAxes) {
                const zoomFactor = mainManager.getters.getGimbal_zoomAmount();
                yawAxes > 0
                    ? mainManager.setters.increaseGimbalHeading(yawAxes * (1 / (zoomFactor/ window._initConfig.gamepad_sensativity)))
                    : mainManager.setters.decreaseGimbalHeading(yawAxes * -1 * (1/ (zoomFactor/ window._initConfig.gamepad_sensativity)))
            }

            if (pitchAxes) {
                const zoomFactor = mainManager.getters.getGimbal_zoomAmount();
                pitchAxes > 0
                    ? mainManager.setters.decreaseGimbalPitch(pitchAxes * 1 * (1 / (zoomFactor / window._initConfig.gamepad_sensativity )))
                    : mainManager.setters.increaseGimbalPitch(pitchAxes * -1 * (1 / (zoomFactor / window._initConfig.gamepad_sensativity )))
            }

            if (zoomAxes) {
                zoomAxes > 0
                    ? mainManager.setters.adjustGimbalZoom(zoomAxes * -1)
                    : mainManager.setters.adjustGimbalZoom(zoomAxes * -1)
            }

            if (toggleLock) {
                mainManager.setters.toggleGimbalLock();
            }

            if (toggleCameraType) {
                mainManager.setters.toggleCameraType();
            }

            if (toggleMovers) {
                mainManager.setters.toggleMovers();
            }

            if(missionSwap) {
                clearTimeout(window._missionSwapCountTimeout);
                window._missionSwapCount += 1
                window._missionSwapCountTimeout = setTimeout(() =>{
                    mainManager.setters.changeSelectedMission(window._missionSwapCount)
                    window._missionSwapCount = -1;
                }, 500)
            }
        }
    }, 25)

}