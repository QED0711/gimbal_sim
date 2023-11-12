
const stateSchema = {

    map: null, 
    isPaused: false,

    position: {lng: -77.229176, lat: 38.864188, alt: 15000 },
    entity: null,

    aircraft: {pitch: 0, heading: 0, velocity: 100},
    gimbal: {pitch: 0, heading: 0, range: 0.1},
}

export default stateSchema;
