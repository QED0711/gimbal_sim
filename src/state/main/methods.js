import * as Cesium from "cesium";

const methods = {
    async updateAircraft() {
        if (!this.state.map || this.state.isPaused || !this.state.entity) return;
        const deltaTime = 0.1;
        const { aircraft: av, map, entity } = this.state;

        const headingRadians = Cesium.Math.toRadians(av.heading);
        const pitchRadians = Cesium.Math.toRadians(av.pitch);

        // Calculate the new position
        // Decompose the movement into the local east-north-up coordinate system
        const localEast = new Cesium.Cartesian3(-Math.sin(headingRadians), Math.cos(headingRadians), 0);
        const localNorth = new Cesium.Cartesian3(
            -Math.cos(headingRadians) * Math.sin(pitchRadians),
            -Math.sin(headingRadians) * Math.sin(pitchRadians),
            Math.cos(pitchRadians)
        );
        const localUp = new Cesium.Cartesian3(
            Math.cos(headingRadians) * Math.cos(pitchRadians),
            Math.sin(headingRadians) * Math.cos(pitchRadians),
            Math.sin(pitchRadians)
        );

        // Calculate the movement vector in the local frame
        const movementVectorLocal = new Cesium.Cartesian3();
        Cesium.Cartesian3.multiplyByScalar(localNorth, av.velocity * deltaTime, movementVectorLocal);

        // Convert the movement from the local east-north-up frame to the Earth fixed frame
        const aircraftPosition = this.state.entity.position.getValue(map.clock.currentTime);
        const transformMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(aircraftPosition);
        const movementVector = new Cesium.Cartesian3();
        Cesium.Matrix4.multiplyByPointAsVector(transformMatrix, movementVectorLocal, movementVector);

        // Update the aircraft's position
        const newPosition = new Cesium.Cartesian3();
        Cesium.Cartesian3.add(aircraftPosition, movementVector, newPosition);
        const cartographicPosition = Cesium.Cartographic.fromCartesian(newPosition);
        this.setters.setPosition({
            lng: Cesium.Math.toDegrees(cartographicPosition.longitude),
            lat: Cesium.Math.toDegrees(cartographicPosition.latitude),
            alt: cartographicPosition.height
        })
        // debugger
        // console.log(newPosition);
        // entity.position = newPosition;

        // await new Promise(r => setTimeout(r, 1000));

        requestAnimationFrame(this.methods.updateAircraft);
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
