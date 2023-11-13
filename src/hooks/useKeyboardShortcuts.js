import { useEffect } from "react";
import mainManager from "../state/main/mainManager";

export default function useKeyboardShortcuts() {
    useEffect(() => {
        const keyboardActions = {
            ArrowUp(e) {
                e.shiftKey
                    ? mainManager.setters.adjustGimbalZoom(-500) 
                    : mainManager.setters.increaseGimbalPitch(e.ctrlKey ? 0.1 : 1);
            },
            ArrowDown(e) {
                e.shiftKey
                    ? mainManager.setters.adjustGimbalZoom(500)
                    : mainManager.setters.decreaseGimbalPitch(e.ctrlKey ? 0.1 : 1);
            },
            ArrowLeft(e) {
                mainManager.setters.decreaseGimbalHeading(e.ctrlKey ? 0.1 : 1);
            },
            ArrowRight(e) {
                mainManager.setters.increaseGimbalHeading(e.ctrlKey ? 0.1 : 1);
            },

            l(){
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
                mainManager.setters.increaseAircraftVelocity(1 / 2.237)
            },

            "-": () => {
                mainManager.setters.decreaseAircraftVelocity(1 / 2.237)
            },

        };

        window.addEventListener("keydown", function (e) {
            keyboardActions[e.key]?.(e);
        });
        window.addEventListener("wheel", function (e) {
            e.deltaY > 0 ? mainManager.setters.adjustGimbalZoom(500) : mainManager.setters.adjustGimbalZoom(-500);
        });
    }, []);
}
