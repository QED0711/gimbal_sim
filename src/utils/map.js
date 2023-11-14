import * as Cesium from 'cesium';

export function calcHeading(coord1, coord2) {
    const cartographic1 = Cesium.Cartographic.fromDegrees(coord1.lng, coord1.lat, coord1.alt);
    const cartographic2 = Cesium.Cartographic.fromDegrees(coord2.lng, coord2.lat, coord2.alt);

    const geodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2);

    let heading = Cesium.Math.toDegrees(geodesic.startHeading);
    
    heading += heading < 0 ? 360 : 0;

    return heading
    
}

export function calcPitch(coord1, coord2) {
    // Convert points to Cesium Cartographic format
    var cartographic1 = Cesium.Cartographic.fromDegrees(coord1.lng, coord1.lat, coord1.alt);
    var cartographic2 = Cesium.Cartographic.fromDegrees(coord2.lng, coord2.lat, coord2.alt);

    // Calculate the surface distance between the two points
    var surfaceDistance = Cesium.Cartesian3.distance(
        Cesium.Cartesian3.fromRadians(cartographic1.longitude, cartographic1.latitude, cartographic1.height),
        Cesium.Cartesian3.fromRadians(cartographic2.longitude, cartographic2.latitude, cartographic2.height)
    );

    // Calculate the elevation difference
    var elevationDifference = cartographic2.height - cartographic1.height;

    // Calculate pitch in radians
    var pitchRadians = Math.atan2(elevationDifference, surfaceDistance);

    // Convert pitch to degrees
    var pitchDegrees = Cesium.Math.toDegrees(pitchRadians);

    return pitchDegrees;
}