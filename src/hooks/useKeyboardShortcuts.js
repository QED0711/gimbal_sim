import { useEffect } from "react"
import mainManager from "../state/main/mainManager"

export default function useKeyboardShortcuts() {
    useEffect(() => {
        const actions = {
            ArrowUp(){
                mainManager.methods.adjustPitch(0.25)
            }, 
            ArrowDown(){
                mainManager.methods.adjustPitch(-0.25)
            }, 
            ArrowLeft(e){
                e.shiftKey
                    ? mainManager.methods.adjustRoll(-0.25)
                    : mainManager.methods.adjustHeading(-0.25)
            }, 
            ArrowRight(e){
                e.shiftKey
                ? mainManager.methods.adjustRoll(0.25)
                : mainManager.methods.adjustHeading(0.25)
            }, 
        }

        window.addEventListener("keydown", function(e){
            actions[e.key]?.(e)
        })

    }, [])
}