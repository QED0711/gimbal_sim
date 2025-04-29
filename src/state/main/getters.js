import * as Cesium from "cesium";

const getters = {

    getSelectedMission() {
        return this.state.missions[this.state.selectedMissionIndex]
    },

    getCoordinateAtPixel({ x, y }) {
        const map = this.state.map;
        if (!map || !map.camera || !map.scene || !map.scene.globe) return null;


        if (typeof x !== 'number' || isNaN(x)) x = window.innerWidth / 2;
        if (typeof y !== 'number' || isNaN(y)) y = window.innerHeight / 2;

        try {
            const pixelPosition = new Cesium.Cartesian2(x, y);

            const ray = map.camera.getPickRay(pixelPosition);
            if (!ray) return null;

            const cartesianPosition = map.scene.globe.pick(ray, map.scene);

            if (!cartesianPosition) return null;

            let cartographicPosition = Cesium.Cartographic.fromCartesian(cartesianPosition);

            const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
            const lng = Cesium.Math.toDegrees(cartographicPosition.longitude);
            const alt = cartographicPosition.height;

            return { lat, lng, alt };
        } catch (err) {
            console.error("Get Coordinate Error: ", err);
            return null
        }


    },

    getFov() {
        const camera = this.state.map?.camera;
        if (!camera) return;

        try {
            return {
                hfov: Cesium.Math.toDegrees(camera.frustum.fov),
                vfov: Cesium.Math.toDegrees(camera.frustum.fovy),
            };
        } catch(err) {
            console.error("FOV ERROR: ", err)
            return null
        }
    },

    getMetadata() {
        try {
            const aircraft = this.state.aircraft;
            const position = this.state.position;
            const gimbal = this.state.gimbal;
            const frameCenter = this.getters.getCoordinateAtPixel({}); // defaults to frame center if no pixel given;
            const fov = this.getters.getFov();
            const mission = this.getters.getSelectedMission();

            let relativeAzimuth = gimbal.heading - aircraft.heading;
            relativeAzimuth = relativeAzimuth >= 0 ? relativeAzimuth : relativeAzimuth + 360;
            
            const metadata = {
                precisionTimeStamp: Date.now(),
                missionID: mission?.name ?? "MISSION",
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
                frameCenterAltitude: (frameCenter?.alt ?? 0.0) + (this.state.manualAltCorrection || (mission?.alt_correction ?? 0)),
            }

            return metadata;
        } catch (err) {
            console.error("GET METADATA: ", err)
        }
    },

    getGamepads() {
        const gamepads = navigator.getGamepads?.();
        console.log({ gamepads });
        if (gamepads && gamepads.length !== this.state.gamepads.length) {
            this.setters.setGamepads(gamepads)
        }
    },

    getVehicles() {
        const entities = this.state.map?.entities?._entities?._array
        if (!entities) return [];
        return entities.filter(e => Boolean(e.id.match(/^VEHICLE-/i)))
    },

    getVehicleByIdx(idx) {
        const vehicles = this.getters.getVehicles()
        for (const vehicleEntity of vehicles) {
            const entityIdx = vehicleEntity.id.split("-")[1]
            if (idx == entityIdx) return vehicleEntity;
        }
    },

    getVehiclePosition(idx) {
        return this.state.vehiclePositions[idx] ?? null
    },
}

export default getters;
