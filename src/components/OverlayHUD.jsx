import { useEffect, useLayoutEffect, useRef } from "react"
import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../state/main/mainManager";

const useScaleCanvas = (canvasRef) => {
    useLayoutEffect(() => {
        const dpr = window.devicePixelRatio ?? 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        canvasRef.current.style.width = window.innerWidth + "px";
        canvasRef.current.style.height = window.innerHeight + "px";

        const ctx = canvasRef.current.getContext("2d");
        ctx.scale(dpr, dpr);

    }, [])
}

const useUpdatePosition = (canvasRef, position, aircraft) => {
    useLayoutEffect(() => {
        const ctx = canvasRef.current.getContext("2d");

        ctx.clearRect(0, 0, window.innerWidth / 2, window.innerHeight / 2)
        ctx.font = "24px Arial";
        ctx.fillStyle = "cyan"
        ctx.fillText(`LNG: ${position.lng.toFixed(5)}`, 10, 25) 
        ctx.fillText(`LAT: ${position.lat.toFixed(5)}`, 10, 50) 
        ctx.fillText(`ALT: ${position.alt.toFixed(5)}`, 10, 75) 

        ctx.fillText(`PITCH: ${aircraft.pitch}°`, 10, 125) 
        ctx.fillText(`HEADING: ${aircraft.heading}°`, 10, 150) 
    }, [position, aircraft]) 
}

export default function OverlayHUD(){
    const {state} = useSpiccatoState(mainManager, [mainPaths.position, mainPaths.aircraft]);
    const canvasRef = useRef(null);

    useScaleCanvas(canvasRef);
    useUpdatePosition(canvasRef, state.position, state.aircraft);
    return (
        <canvas ref={canvasRef} className="fixed top-0 left-0 bg-transparent" ></canvas>
    )
}