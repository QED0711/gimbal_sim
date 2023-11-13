import * as Cesium from 'cesium';

export function calcHeading(coord1, coord2) {
    const cartographic1 = Cesium.Cartographic.fromDegrees(coord1.lng, coord1.lat, coord1.alt);
    const cartographic2 = Cesium.Cartographic.fromDegrees(coord2.lng, coord2.lat, coord2.alt);

    const geodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2);

    let heading = Cesium.Math.toDegrees(geodesic.startHeading);
    
    heading += heading < 0 ? 360 : 0;

    return heading
    
}