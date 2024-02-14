import * as Cesium from 'cesium';

const getters = {

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

}

export default getters;
