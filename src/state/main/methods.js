import * as Cesium from "cesium";

const methods = {
    simulateFlight() {
        if (!this.state.map || this.state.isPaused) return;

        const deltaTime = 0.1; // time step in seconds;
        const velocity = this.state.velocity;

        const movementVector = new Cesium.Cartesian3();
        Cesium.Cartesian3.multiplyByScalar(this.state.map.camera.direction, velocity * deltaTime, movementVector);
        Cesium.Cartesian3.add(this.state.map.camera.position, movementVector, this.state.map.camera.position);

        requestAnimationFrame(this.methods.simulateFlight)
    },
};

export default methods;
