import * as Cesium from 'cesium';
import models from '../../utils/models';
import { extrapolateRoute } from '../../utils/route';
import { invoke } from '@tauri-apps/api';
import mainManager from './mainManager';

export default {
    registerVehicleModel(vehicle, idx) {
        const map = this.state.map;
        const initLocation = vehicle?.route?.[0];
        const modelInfo = models[vehicle?.model];
        // console.log({map, initLocation, modelInfo})

        if(!map || !initLocation || !modelInfo) return;

        const interpolation = extrapolateRoute(vehicle, 33)

        const vehicleEntity = map.entities.add({
            id: `VEHICLE-${idx}`,
            name: vehicle.name,
            position: new Cesium.CallbackProperty(() => {
                const position = this.getters.getVehiclePosition(idx)
                return Boolean(position)
                    ? Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt)
                    : Cesium.Cartesian3.fromDegrees(initLocation.lng, initLocation.lat, initLocation.alt)
            }, false),
            orientation: new Cesium.CallbackProperty(() => {
                const position = this.getters.getVehiclePosition(idx)
                if(!position) return Cesium.Quaternion.IDENTITY;

                let adjustedHeading = (position.heading + modelInfo.headingAdjustment) % 360;
                adjustedHeading = adjustedHeading < 0 ? adjustedHeading + 360 : adjustedHeading;

                const headingRad = Cesium.Math.toRadians(adjustedHeading);
                const hpr = new Cesium.HeadingPitchRoll(headingRad, 0, 0)
                const posCartesan = Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt)
                return Cesium.Transforms.headingPitchRollQuaternion(posCartesan, hpr)
            }, false), 
            model: {
                uri: modelInfo.path,
                scale: modelInfo.scale,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                shadows: Cesium.ShadowMode.DISABLED,
                color: Cesium.Color.WHITE,
                colorBlendMode: Cesium.ColorBlendMode.HIGHLIGHT,
                colorBlendAmount: 0.5,
                imageBasedLighting: {intensity: 2.0},
            }
        })
        vehicleEntity.vehicleIdx = idx
        vehicleEntity.cotType = vehicle.cot_type;

        this.vehicles.startVehicleMovement(vehicleEntity, interpolation);

        return vehicleEntity
    },

    startVehicleMovement(vehicleEntity, interpolation) {
        if(!vehicleEntity) return;
        vehicleEntity.routeIdx = 0;

        vehicleEntity.movementInterval = setInterval(() => {
            if(!this.getters.getMoversActive()) return; // if movers aren't active, just don't move them. Cot will still send though

            vehicleEntity.routeIdx += 1
            let nextPoint = interpolation[vehicleEntity.routeIdx]
            if(!nextPoint) {
                vehicleEntity.routeIdx = 0
                nextPoint = interpolation[0]
            }
            this.setters.updateVehiclePosition(vehicleEntity.vehicleIdx, nextPoint)
        }, 33)
    },

    clearAllVehicles() {
        if(!this.state.map) return;

        const vehicleEntities = this.getters.getVehicles();
        for(const ve of vehicleEntities) {
            clearInterval(ve.movementInterval);
            this.state.map.entities.remove(ve);
        }
    },

    async sendCotMessages() {
        for(const [idx, position] of Object.entries(this.state.vehiclePositions)) {
            const vehicleEntity = this.getters.getVehicleByIdx(idx)
            if(!vehicleEntity) continue;
            const name = vehicleEntity.name;
            await invoke("send_cot_message", {data: {...position, alt: 0.0, name, cot_type: vehicleEntity.cotType}}) // override alt to be 0 so everything appears on the ground
        }
    }
}