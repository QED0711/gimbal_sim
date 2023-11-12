import { useEffect } from "react"
import mainManager from "../state/main/mainManager"

export default function useKeyboardShortcuts() {
    useEffect(() => {
        const actions = {
            ArrowUp(){
                mainManager.setters.increasePitch(1);
            }, 
            ArrowDown(){
                mainManager.setters.decreasePitch(1);
            }, 
            ArrowLeft(e){
                mainManager.setters.decreaseHeading(1);
                // e.shiftKey
                //     ? mainManager.methods.adjustRoll(-0.25)
                //     : mainManager.methods.adjustHeading(-0.25)
            }, 
            ArrowRight(e){
                mainManager.setters.increaseHeading(1);
                // e.shiftKey
                // ? mainManager.methods.adjustRoll(0.25)
                // : mainManager.methods.adjustHeading(0.25)
            }, 
        }

        window.addEventListener("keydown", function(e){
            actions[e.key]?.(e)
        })

    }, [])
}