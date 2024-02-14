
const stateSchema = {

    map: null,
    position: {lng: 0.0, lat: 0.0, alt: 0.0},
    aircraft: {heading: 0, pitch: 0, velocity: 0},
    target: {lat: 0, lng: 0, alt: 0},

    mapMode: "drag",

    headingWaypoint: null,
    orbit: {type: "no-orbit", rate: 1}

}

export default stateSchema;
