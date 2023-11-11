import * as Cesium from "cesium";

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
    },

    simulateFlight() {
        if (!this.state.map || this.state.isPaused) return;
        const deltaTime = 0.1; // time step in seconds;
        const { map, aircraft: av } = this.state;

        const velocity = av.velocity;
        const headingRadians = Cesium.Math.toRadians(av.heading);
        const pitchRadians = Cesium.Math.toRadians(av.pitch);

        // Create a quaternion from heading and pitch
        const hprQuaternion = Cesium.Quaternion.fromHeadingPitchRoll(
            new Cesium.HeadingPitchRoll(headingRadians, pitchRadians, 0)
        );

        // Convert quaternion to a rotation matrix
        const rotationMatrix = Cesium.Matrix3.fromQuaternion(hprQuaternion);

        // Rotate the forward direction vector by the quaternion
        const forwardDirection = new Cesium.Cartesian3(0, 0, -1); // Negative Z is forward
        Cesium.Matrix3.multiplyByVector(rotationMatrix, forwardDirection, forwardDirection);

        // Calculate the forward direction of the aircraft

        // const aircraftDirection = new Cesium.Cartesian3();
        // Cesium.Matrix4.multiplyByPointAsVector(Cesium.Transforms.headingPitchRollToFixedFrame(
        //     map.camera.position,
        //     new Cesium.HeadingPitchRoll(headingRadians, pitchRadians, 0),
        //     Cesium.Ellipsoid.WGS84,
        //     Cesium.Transforms.eastNorthUpToFixedFrame,
        //     new Cesium.Matrix4()
        // ), Cesium.Cartesian3.UNIT_Z, aircraftDirection);
        // Cesium.Cartesian3.negate(aircraftDirection, aircraftDirection) // invert to point forward

        // Calculate the movement vector
        const movementVector = new Cesium.Cartesian3();
        Cesium.Cartesian3.multiplyByScalar(forwardDirection, velocity * deltaTime, movementVector);

        // Update the aircraft's position
        Cesium.Cartesian3.add(map.camera.position, movementVector, map.camera.position);

        requestAnimationFrame(this.methods.simulateFlight);
    },

    adjustPitch(amount) {
        if (!!this.state.map) {
            const radians = Cesium.Math.toRadians(amount);
            amount < 0 ? this.state.map.camera.lookUp(radians) : this.state.map.camera.lookDown(-radians);
        }
    },

    adjustHeading(amount) {
        if (!!this.state.map) {
            const radians = Cesium.Math.toRadians(amount);
            amount < 0 ? this.state.map.camera.lookRight(radians) : this.state.map.camera.lookLeft(-radians);
        }
    },

    adjustRoll(amount) {
        if (!!this.state.map) {
            const radians = Cesium.Math.toRadians(amount);
            amount < 0 ? this.state.map.camera.twistRight(radians) : this.state.map.camera.twistLeft(-radians);
        }
    },
};

export default methods;
