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

    }

}

export default getters;
