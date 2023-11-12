
const stateSchema = {

    map: null, 
    isPaused: false,

    position: {lng: -77.229176, lat: 38.864188, alt: 15000 },
    entity: null,

    aircraft: {
        pitch: 0, 
        heading: 0, 
        velocity: 87.17031738936095 // equal to 195 mph
    },
    gimbal: {
        pitch: 0, 
        heading: 0, 
        range: 0.01, 
        zoomAmount: 0,
        isLocked: false,
        lockPoint: {lat: 0.0, lng: 0.0}

    },
}

export default stateSchema;
