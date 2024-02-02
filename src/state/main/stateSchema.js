import { invoke } from "@tauri-apps/api";
window._initConfig = await invoke("retrieve_config");

const initConfig = window._initConfig

const stateSchema = {

    imageDimensions: { width: 1280, height: 720 },
    map: null,
    isPaused: false,

    position: {
        lng: initConfig.start_lng ?? 0.0, 
        lat: initConfig.start_lat ?? 0.0, 
        alt: initConfig.start_alt ?? 10000
    },
    entity: null,

    aircraft: {
        pitch: 0,
        heading: initConfig.start_heading ?? 0,
        // velocity: 87.17031738936095 // equal to 195 mph
        velocity: initConfig.start_speed ?? 50.0
        // velocity: 0
    },
    gimbal: {
        pitch: 0,
        heading: 0,
        range: 0.01,
        zoomAmount: 1,
        isLocked: initConfig.target_lock ?? false,
        target: { 
            lat: initConfig.target_lat ?? 0.0, 
            lng: initConfig.target_lng ?? 0.0, 
            alt: 0.00 
        }

    },
}

export default stateSchema;
