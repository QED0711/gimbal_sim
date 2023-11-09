import * as Cesium from "cesium";
import { useEffect } from "react";

export default function MapContainer(){

    useEffect(() => {
        const viewer = new Cesium.Viewer("map");
    }, [])

    return (
        <div id="map" className="w-screen h-screen"></div>
    )
}