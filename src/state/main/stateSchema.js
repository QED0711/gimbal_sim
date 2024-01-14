
const stateSchema = {

    imageDimensions: {width: 1280, height: 720},
    map: null, 
    isPaused: false,

    position: {lng: -77.229176, lat: 38.864188, alt: 15000 },
    entity: null,

    aircraft: {
        pitch: 0, 
        heading: 0, 
        velocity: 87.17031738936095 // equal to 195 mph
        // velocity: 0
    },
    gimbal: {
        pitch: 0, 
        heading: 0, 
        range: 0.01, 
        zoomAmount: 0,
        isLocked: false,
        target: {lat: 38.93911, lng: -77.44456, alt: 0.00}

    },
}

export default stateSchema;
