import * as Cesium from 'cesium';

const methods = {

    zoomToAircraft(){
        if(!this.state.map) return;

        this.state.map.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(this.state.position.lng, this.state.position.lat),
            duration: 0
        })
    },

    

}

export default methods;
