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
        /* TODO: This calculation of FOV appears to be incorrect and doesn't respond to changes in "zoom". Use another method with corner points, altitude, etc. */
        const camera = this.state.map?.camera;
        if(!camera) return;

        const frustum = camera.frustum;
        const fov = frustum.fov;
        const aspectRatio = frustum.aspectRatio;

        let hfov, vfov;

        if(aspectRatio >= 1 ) {
            hfov = fov;
            vfov = 2 * Math.atan(Math.tan(fov / 2) * aspectRatio);
        } else {
            vfov = fov;
            hfov = 2 * Math.atan(Math.tan(fov / 2) * aspectRatio);
        }

        hfov = Cesium.Math.toDegrees(hfov);
        vfov = Cesium.Math.toDegrees(vfov);

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
            missionID: "ABC123",
            platformTailNumber: "NTR42",

            platformHeadingAngle: aircraft.heading,
            platformPitchAngle: aircraft.pitch,
            platformRollAngle: 0.0,
            platformTrueAirSpeed: aircraft.velocity,

            platformIndicatedAirSpeed: aircraft.velocity,
            platformDesignation: "tauri",
            imageSourceSensor: "gimbal_sim",
            imageCoordinateSystem: "CRS:4326",

            sensorLatitude: position.lat,
            sensorLongitude: position.lng,
            sensorAltitude: position.alt,

            frameCenterLatitude: frameCenter?.lat ?? 0.0,
            frameCenterLongitude: frameCenter?.lng ?? 0.0,
            frameCenterAltitude: frameCenter?.alt ?? 0.0,

            sensorRelativeAzimuthAngle: gimbal.heading, // note this is not relative right now and needs to be fixed
            sensorRelativeElevationAngle: gimbal.pitch, // note this is not relative right now and needs to be fixed
            sensorRelativeRollAngle: 0.0,

            hfov: fov?.hfov ?? 0.0,
            vfov: fov?.vfov ?? 0.0,

        }

        return metadata;
    }

}

export default getters;
