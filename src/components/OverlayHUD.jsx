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

const useDrawCenterReticule = (canvasRef) => {
    useLayoutEffect(() => {
        const ctx = canvasRef.current.getContext("2d");
        const center = {x: window.innerWidth / 2, y: window.innerHeight / 2};

        ctx.lineWidth = 5;
        ctx.strokeStyle = "cyan";

        ctx.beginPath();
        ctx.moveTo(center.x, center.y - 10);
        ctx.lineTo(center.x, center.y - 40);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(center.x + 10, center.y);
        ctx.lineTo(center.x + 40, center.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(center.x, center.y + 10);
        ctx.lineTo(center.x, center.y + 40);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(center.x - 10, center.y);
        ctx.lineTo(center.x - 40, center.y);
        ctx.stroke();

    }, [])
}
const useUpdatePosition = (canvasRef, position, aircraft, gimbal) => {
    useLayoutEffect(() => {
        const ctx = canvasRef.current.getContext("2d");

        ctx.clearRect(0, 0, window.innerWidth / 2 - 16, window.innerHeight / 2 - 16)
        ctx.font = "24px Arial";
        ctx.fillStyle = "cyan"
        ctx.fillText(`LNG: ${position.lng.toFixed(5)}`, 10, 25) 
        ctx.fillText(`LAT: ${position.lat.toFixed(5)}`, 10, 50) 
        ctx.fillText(`ALT: ${position.alt.toFixed(2)} meters`, 10, 75) 

        ctx.fillText(`PITCH: ${aircraft.pitch}°`, 10, 125) 
        ctx.fillText(`HEADING: ${aircraft.heading}°`, 10, 150) 
        ctx.fillText(`SPEED: ${(aircraft.velocity * 2.237).toFixed(2)} mph`, 10, 175) 

        ctx.fillText(`GIMBAL PITCH: ${gimbal.pitch.toFixed(2)}°`, 10, 200) 
        ctx.fillText(`GIMBAL HEADING: ${gimbal.heading.toFixed(2)}°`, 10, 225) 
        ctx.fillText(`GIMBAL ZOOM: ${gimbal.range.toFixed(2)}°`, 10, 250) 
        
        const centerCoord = mainManager.getters.getCoordinateAtPixel({});
        ctx.fillText(`TGT LNG: ${centerCoord?.lng?.toFixed?.(5) ?? "--"}°`, 10, 300) 
        ctx.fillText(`TGT LAT: ${centerCoord?.lat?.toFixed?.(5) ?? "--"}°`, 10, 325) 
        ctx.fillText(`TGT LAT: ${centerCoord?.alt?.toFixed?.(2) ?? "--"} meters`, 10, 350) 
        // ctx.fillText(`TGT LAT: ${gimbal.range.toFixed(2)}°`, 10, 250) 
        
    }, [position, aircraft]) 
}

export default function OverlayHUD(){
    const {state} = useSpiccatoState(mainManager, [mainPaths.position, mainPaths.aircraft, mainPaths.gimbal]);
    const canvasRef = useRef(null);

    useScaleCanvas(canvasRef);
    useDrawCenterReticule(canvasRef);
    useUpdatePosition(canvasRef, state.position, state.aircraft, state.gimbal);

    // useLayoutEffect(() => {
    //     setInterval(() => {
    //         mainManager.methods.sendImage(canvasRef.current);
    //     })
    // }, [])
    return (
        <canvas ref={canvasRef} className="fixed top-0 left-0 bg-transparent"></canvas>
    )
}