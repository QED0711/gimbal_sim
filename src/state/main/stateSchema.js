
const stateSchema = {

    map: null, 
    isPaused: false,

    startPosition: {lng: -77.229176, lat: 38.864188, alt: 15000 },
    entity: null,

    aircraft: {pitch: 0, heading: 0, velocity: 50},
    velocity: 50, 
}

export default stateSchema;
