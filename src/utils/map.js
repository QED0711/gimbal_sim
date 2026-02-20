import * as Cesium from 'cesium';
import mainManager from '../state/main/mainManager';

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
    const geodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2);
    const surfaceDistance = geodesic.surfaceDistance;
    // var surfaceDistance = Cesium.Cartesian3.distance(
    //     Cesium.Cartesian3.fromRadians(cartographic1.longitude, cartographic1.latitude, cartographic1.height),
    //     Cesium.Cartesian3.fromRadians(cartographic2.longitude, cartographic2.latitude, cartographic2.height)
    // );

    // Calculate the elevation difference
    var elevationDifference = cartographic2.height - cartographic1.height;

    // Calculate pitch in radians
    var pitchRadians = Math.atan2(elevationDifference, surfaceDistance);

    // Convert pitch to degrees
    var pitchDegrees = Cesium.Math.toDegrees(pitchRadians);

    return pitchDegrees;
}


/**
 * Sets the viewer's clock to a static time such that the given lat/lng location is lit.
 * The time is set to local solar noon for that longitude.
 *
 * @param {number} lat - Latitude of the location (degrees).
 * @param {number} lng - Longitude of the location (degrees).
 */
export function setSunlitTime( lat, lng) {
    const map = mainManager.getters.getMap();
    // Get today's date in UTC.
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // zero-indexed: January is 0.
    const day = now.getUTCDate();

    // Calculate local solar noon.
    // For a given longitude, local solar noon (LMST = 12:00) corresponds to:
    // UTC time = 12:00 - (lng / 15)
    // Note: This works for both east (positive lng) and west (negative lng).
    const noonUTC = 12 - (lng / 15);

    // Create a new Date object in UTC at the calculated hour.
    const fixedDate = new Date(Date.UTC(year, month, day, noonUTC, 0, 0));
    
    // Convert the fixedDate to a Cesium JulianDate.
    const julianDate = Cesium.JulianDate.fromDate(fixedDate);

    // Set the viewer's clock to this time and stop animation.
    map.clock.currentTime = julianDate;
    map.clock.shouldAnimate = false;
}