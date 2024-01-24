import * as Cesium from "cesium";

const getters = {

    getCoordinateAtPixel({x, y}) {
        if(!this.state.map) return null;
        const map = this.state.map;
        x ??= window.innerWidth / 2;
        y ??= window.innerHeight / 2;

        const pixelPosition = new Cesium.Cartesian2(x, y);
        const cartesianPosition = map.camera.pickEllipsoid(pixelPosition, map.scene.globe.ellipsoid);

        if(!cartesianPosition) return null;

        const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesianPosition);


        const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
        const lng = Cesium.Math.toDegrees(cartographicPosition.longitude);
        const alt = cartographicPosition.height;
        return {lat, lng, alt};

    },

    getFov(){
        const camera = this.state.map?.camera;
        if(!camera) return;
        const imageDimensions = this.state.imageDimensions;

        const tl = this.getters.getCoordinateAtPixel({x: 0, y: 0});
        const br = this.getters.getCoordinateAtPixel({x: window.innerWidth, y: window.innerHeight});
        if(!tl || !br) return {hfov: 0.0, vfov: 0.0}; // note that this means FOV is nullified if the camera looks beyond the horizon.

        const tlCartesian = Cesium.Cartesian3.fromDegrees(tl.lng, tl.lat, tl.alt);
        const brCartesian = Cesium.Cartesian3.fromDegrees(br.lng, br.lat, br.alt);

        const distance = Cesium.Cartesian3.distance(tlCartesian, brCartesian);
        const cameraAlt = camera.positionCartographic.height;

        const diagonalFOV = 2 * Math.atan((distance / 2) / cameraAlt);

        const aspectRatio = imageDimensions.width / imageDimensions.height;

        let hfov = 2 * Math.atan(Math.tan(diagonalFOV / 2) * aspectRatio);
        let vfov = 2 * Math.atan(Math.tan(diagonalFOV / 2) / aspectRatio);
        
        return {hfov, vfov};
    },

    getMetadata(){
        const aircraft = this.state.aircraft;
        const position = this.state.position;
        const gimbal = this.state.gimbal;
        const frameCenter = this.getters.getCoordinateAtPixel({}); // defaults to frame center if no pixel given;
        const fov = this.getters.getFov();

        const metadata = {
            precisionTimeStamp: Date.now(),
            missionID: "MISSION_01",
            platformTailNumber: "NTR42",

            platformHeadingAngle: aircraft.heading,
            platformPitchAngle: 0.0, // even if we're reporting a pitch, the relative sensor orientation still assumes 0 pitch in this configuration
            platformRollAngle: 0.0,
            platformTrueAirSpeed: Math.round(aircraft.velocity),

            // platformIndicatedAirSpeed: aircraft.velocity,
            platformDesignation: "TAURI",
            imageSourceSensor: "gimbal_sim",
            imageCoordinateSystem: "EPSG:4326",

            sensorLatitude: position.lat,
            sensorLongitude: position.lng,
            sensorTrueAltitude: position.alt, 

            hfov: fov?.hfov ?? 0.0,
            vfov: fov?.vfov ?? 0.0,

            sensorRelativeAzimuthAngle: gimbal.heading, // note this is not relative right now and needs to be fixed
            sensorRelativeElevationAngle: gimbal.pitch, // note this is not relative right now and needs to be fixed
            sensorRelativeRollAngle: 0.0,

            frameCenterLatitude: frameCenter?.lat ?? 0.0,
            frameCenterLongitude: frameCenter?.lng ?? 0.0,
            frameCenterAltitude: frameCenter?.alt ?? 0.0,
        }


        return metadata;
    }

}

export default getters;
