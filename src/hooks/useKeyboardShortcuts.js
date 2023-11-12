import { useEffect } from "react";
import mainManager from "../state/main/mainManager";

export default function useKeyboardShortcuts() {
    useEffect(() => {
        const keyboardActions = {
            ArrowUp(e) {
                e.shiftKey
                    ? mainManager.setters.increaseAircraftPitch(1)
                    : mainManager.setters.increaseGimbalPitch(e.ctrlKey ? 0.1 : 1);
            },
            ArrowDown(e) {
                e.shiftKey
                    ? mainManager.setters.decreaseAircraftPitch(1)
                    : mainManager.setters.decreaseGimbalPitch(e.ctrlKey ? 0.1 : 1);
            },
            ArrowLeft(e) {
                e.shiftKey
                    ? mainManager.setters.decreaseAircraftHeading(e.ctrlKey ? 0.1 : 1)
                    : mainManager.setters.decreaseGimbalHeading(e.ctrlKey ? 0.1 : 1);
            },
            ArrowRight(e) {
                e.shiftKey
                    ? mainManager.setters.increaseAircraftHeading(e.ctrlKey ? 0.1 : 1)
                    : mainManager.setters.increaseGimbalHeading(e.ctrlKey ? 0.1 : 1);
            },
            "=": function (e) {
                mainManager.setters.adjustGimbalZoom(-500);
            },
            "-": function (e) {
                mainManager.setters.adjustGimbalZoom(500);
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
