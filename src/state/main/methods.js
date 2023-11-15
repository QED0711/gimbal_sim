import { invoke } from "@tauri-apps/api";
import * as Cesium from "cesium";
import { calcHeading, calcPitch } from "../../utils/map";

let callCount = 0;
let lastLogTime = Date.now();

function logCallRate() {
    const now = Date.now();
    callCount++;

    if (now - lastLogTime >= 1000) {
        // Check if one second has passed
        console.log(`Function called ${callCount} times in the last second.`);
        callCount = 0; // Reset the counter
        lastLogTime = now; // Update the last log time
    }
}

function calculateSpeed(deltaTimeMs, prevLat, prevLng, curLat, curLng) {
    // Check if Cesium is loaded
    if (typeof Cesium === "undefined") {
        console.error("Cesium is not loaded");
        return;
    }

    // Convert deltaTime from milliseconds to seconds
    const deltaTimeSeconds = deltaTimeMs / 1000;

    // Create Cesium Cartographic objects for previous and current positions
    const prevPosition = Cesium.Cartographic.fromDegrees(prevLng, prevLat);
    const curPosition = Cesium.Cartographic.fromDegrees(curLng, curLat);

    // Calculate the surface distance in meters
    const surfaceDistance = Cesium.Cartesian3.distance(
        Cesium.Ellipsoid.WGS84.cartographicToCartesian(prevPosition),
        Cesium.Ellipsoid.WGS84.cartographicToCartesian(curPosition)
    );

    // Calculate speed in meters per second
    const speed = surfaceDistance / deltaTimeSeconds;

    return speed;
}

const methods = {
    async updateAircraftPosition() {
        if (!this.state.map || this.state.isPaused || !this.state.entity) return;
        const now = Date.now();
        const deltaTime = (now - (window._lastPositionUpdate ?? now - 33)) / 1000;
        window._lastPositionUpdate = Date.now();
        const { aircraft: av, position: currentPosition } = this.state;

        const headingRadians = Cesium.Math.toRadians(av.heading);
        const pitchRadians = Cesium.Math.toRadians(av.pitch);

        const distanceMoved = av.velocity * deltaTime;

        const deltaAltitude = distanceMoved * Math.sin(pitchRadians);
        const horizontalDistance = distanceMoved * Math.cos(pitchRadians);
        const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
        const deltaLatitude = Cesium.Math.toDegrees((horizontalDistance / earthRadius) * Math.cos(headingRadians));
        const deltaLongitude = Cesium.Math.toDegrees(
            (horizontalDistance / (earthRadius * Math.cos(currentPosition.lat))) * Math.sin(headingRadians)
        );

        const lat = currentPosition.lat + deltaLatitude,
            lng = currentPosition.lng + deltaLongitude,
            alt = currentPosition.alt + deltaAltitude;

        await this.setters.setPosition({ lat, lng, alt });

        if(this.state.gimbal.isLocked) {
            const heading = calcHeading({lat, lng, alt}, this.state.gimbal.target);
            const pitch = calcPitch({lat, lng, alt}, this.state.gimbal.target);

            this.setters.setGimbalHeadingPitch(heading, pitch);
        }

    },

    updateCamera() {
        if (!!this.state.map) {
            const gimbal = this.state.gimbal;
            const camera = this.state.map.camera;

            let heading, pitch;
                heading = Cesium.Math.toRadians(gimbal.heading);
                pitch = Cesium.Math.toRadians(gimbal.pitch);

            camera.lookAt(
                this.state.entity.position.getValue(),
                new Cesium.HeadingPitchRange(heading, pitch, gimbal.range)
            );
            camera.zoomIn(gimbal.zoomAmount);
        }
    },

    sendImage(canvas){
        if(!this.state.map) return;
        
        this.state.map.canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = async function(){
                const arrayBuffer = reader.result;
                const data = Array.from(new Uint8Array(arrayBuffer));
                await invoke("receive_image", {imageArr: data});
            }
            reader.readAsArrayBuffer(blob);
        }, "image/jpeg", 0.9);
    }
};

export default methods;
