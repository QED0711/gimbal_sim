import { useEffect, useLayoutEffect, useRef } from "react"
import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../state/main/mainManager";

const useUpdatePosition = (canvasRef, position) => {
    useLayoutEffect(() => {

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, window.innerWidth / 2, window.innerHeight / 2)
        ctx.font = "8px Arial";
        ctx.fillStyle = "cyan"
        ctx.fillText(`
            LAT: ${position.lat.toFixed(5)}
            LNG: ${position.lng.toFixed(5)}
            ALT: ${position.alt.toFixed(5)}
        `, 10, 10) 
    }, [position]) 
}

export default function OverlayHUD(){
    const {state} = useSpiccatoState(mainManager, [mainPaths.position]);
    const canvasRef = useRef(null);

    useUpdatePosition(canvasRef, state.position);
    return (
        <canvas ref={canvasRef} className="fixed top-0 left-0 bg-transparent" style={{width: window.innerWidth, height: window.innerHeight}}></canvas>
    )
}