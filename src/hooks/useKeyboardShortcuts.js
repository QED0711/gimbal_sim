import { useEffect } from "react";
import mainManager from "../state/main/mainManager";

const tempRemoveGimbalLock = () => {
    if(window._didRemoveLock) {
        mainManager.setters.setTargetToCenterScreen();
    }
    if (!window._didRemoveLock && mainManager.getters.getGimbal_isLocked()) {
        window._didRemoveLock = true;
        mainManager.setters.setGimbal_isLocked(false);
    }
    
};

const restoreGimbalLock = () => {
    if(window._didRemoveLock) {
        mainManager.setters.setGimbal_isLocked(true);
        delete window._didRemoveLock;
    }
}

export default function useKeyboardShortcuts() {
    useEffect(() => {
        const keyboardActions = {
            ArrowUp(e) {
                if (e.shiftKey) {
                    mainManager.setters.adjustGimbalZoom(-500);
                } else {
                    tempRemoveGimbalLock();
                    mainManager.setters.increaseGimbalPitch(e.ctrlKey ? 0.1 : 1);
                }
            },
            ArrowDown(e) {
                if (e.shiftKey) {
                    mainManager.setters.adjustGimbalZoom(500);
                } else {
                    tempRemoveGimbalLock();
                    mainManager.setters.decreaseGimbalPitch(e.ctrlKey ? 0.1 : 1);
                }
            },
            ArrowLeft(e) {
                tempRemoveGimbalLock();
                mainManager.setters.decreaseGimbalHeading(e.ctrlKey ? 0.1 : 1);
            },
            ArrowRight(e) {
                tempRemoveGimbalLock();
                mainManager.setters.increaseGimbalHeading(e.ctrlKey ? 0.1 : 1);
            },

            l() {
                mainManager.setters.toggleGimbalLock();
            },

            a(e) {
                mainManager.setters.decreaseAircraftHeading(e.ctrlKey ? 0.1 : 1);
            },

            d(e) {
                mainManager.setters.increaseAircraftHeading(e.ctrlKey ? 0.1 : 1);
            },

            w(e) {
                mainManager.setters.increaseAircraftPitch(1);
            },

            s(e) {
                mainManager.setters.decreaseAircraftPitch(1);
            },

            "=": () => {
                mainManager.setters.increaseAircraftVelocity(1 / 2.237);
            },

            "-": () => {
                mainManager.setters.decreaseAircraftVelocity(1 / 2.237);
            },
        };

        window.addEventListener("keydown", function (e) {
            keyboardActions[e.key]?.(e);
        });

        window.addEventListener("keyup", function (e) {
            if(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)){
                restoreGimbalLock();
            }
        });

        window.addEventListener("wheel", function (e) {
            e.deltaY > 0 ? mainManager.setters.adjustGimbalZoom(500) : mainManager.setters.adjustGimbalZoom(-500);
        });
    }, []);
}
