import * as Cesium from 'cesium';
import models from '../../utils/models';

export default {
    registerVehicleModel(vehicle, idx) {
        const map = this.state.map;
        const initLocation = vehicle?.route?.[0];
        const modelInfo = models[vehicle?.model];
        console.log({map, initLocation, modelInfo})

        if(!map || !initLocation || !modelInfo) return;

        const vehicleEntity = map.entities.add({
            id: `VEHICLE-${idx}`,
            position: Cesium.Cartesian3.fromDegrees(initLocation.lng, initLocation.lat, 1000),
            model: {
                uri: modelInfo.path,
                scale: modelInfo.scale,
                // minimumPixelSize: 5000,
                // heightReference: initLocation.alt ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND 
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            }
        })

        console.log(vehicleEntity)
    }
}