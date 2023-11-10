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

    adjustPitch(amount) {
        if (!!this.state.map) {
            const radians = Cesium.Math.toRadians(amount);
            amount < 0
                ? this.state.map.camera.lookUp(radians)
                : this.state.map.camera.lookDown(-radians)
        }
    },

    adjustHeading(amount){
        if(!!this.state.map) {
            const radians = Cesium.Math.toRadians(amount);
            amount < 0
                ? this.state.map.camera.lookRight(radians)
                : this.state.map.camera.lookLeft(-radians)
        }
    }
};

export default methods;
