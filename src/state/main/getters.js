import * as Cesium from "cesium";

const getters = {

    getSelectedMission(){
        return this.state.missions[this.state.selectedMissionIndex]
    },

    getCoordinateAtPixel({x, y}) {
        if(!this.state.map) return null;
        const map = this.state.map;
        x ??= window.innerWidth / 2;
        y ??= window.innerHeight / 2;

        const pixelPosition = new Cesium.Cartesian2(x, y);
        let cartesianPosition = map.scene.pickPosition(pixelPosition);
        // const cartesianPosition = map.camera.pickEllipsoid(pixelPosition, map.scene.globe.ellipsoid);

        // use a fallback in to calculate position if pickPosition is not accurate
        if(!cartesianPosition) {
            const ray = map.camera.getPickRay(pixelPosition);
            cartesianPosition = map.scene.globe.pick(ray, map.scene);
        }

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

        return {
            hfov: Cesium.Math.toDegrees(camera.frustum.fov),
            vfov: Cesium.Math.toDegrees(camera.frustum.fovy),
        };
    },

    getMetadata(){
        const aircraft = this.state.aircraft;
        const position = this.state.position;
        const gimbal = this.state.gimbal;
        const frameCenter = this.getters.getCoordinateAtPixel({}); // defaults to frame center if no pixel given;
        const fov = this.getters.getFov();

        let relativeAzimuth = gimbal.heading - aircraft.heading;
        relativeAzimuth = relativeAzimuth >= 0 ? relativeAzimuth : relativeAzimuth + 360;

        const metadata = {
            precisionTimeStamp: Date.now(),
            missionID: this.getters.getSelectedMission()?.name ?? "MISSION",
            platformTailNumber: "NTR42",

            platformHeadingAngle: aircraft.heading,
            platformPitchAngle: 0.0, // even if we're reporting a pitch, the relative sensor orientation still assumes 0 pitch in this simulator
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

            sensorRelativeAzimuthAngle: relativeAzimuth, 
            sensorRelativeElevationAngle: gimbal.pitch, 
            sensorRelativeRollAngle: 0.0,

            frameCenterLatitude: frameCenter?.lat ?? 0.0,
            frameCenterLongitude: frameCenter?.lng ?? 0.0,
            frameCenterAltitude: frameCenter?.alt ?? 0.0,
        }

        return metadata;
    },

    getGamepads(){
        const gamepads = navigator.getGamepads?.();
        console.log({gamepads});
        if(gamepads && gamepads.length !== this.state.gamepads.length) {
            this.setters.setGamepads(gamepads) 
        }
    }

}

export default getters;
