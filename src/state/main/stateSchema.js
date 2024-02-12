const initConfig = window._initConfig

const stateSchema = {

    imageDimensions: { width: 1280, height: 720 },
    map: null,
    hud: null,
    includeHud: true,
    isPaused: false,

    missions: initConfig.mission_templates ?? [],
    selectedMissionIndex: 0,

    position: {
        lng: initConfig.mission_templates?.[0]?.aircraft_location?.lng ?? 0.0, 
        lat: initConfig.mission_templates?.[0]?.aircraft_location?.lat ?? 0.0, 
        alt: initConfig.mission_templates?.[0]?.aircraft_location?.alt ?? 10000, 
        // lat: initConfig.start_lat ?? 0.0, 
        // alt: initConfig.start_alt ?? 10000
    },
    entity: null,

    aircraft: {
        pitch: 0,
        heading: initConfig.mission_templates?.[0]?.orientation?.heading ?? 0,
        velocity: initConfig.mission_templates?.[0]?.orientation?.speed ?? 0,
        // velocity: 87.17031738936095 // equal to 195 mph
        // velocity: initConfig.start_speed ?? 50.0
        // velocity: 0
    },
    gimbal: {
        pitch: 0,
        heading: initConfig.mission_templates?.[0]?.orientation?.heading ?? 0,
        range: 0.01,
        zoomAmount: 1,
        isLocked: initConfig.mission_templates?.[0]?.target_lock ?? false,
        // isLocked: initConfig.target_lock ?? false,
        target: { 
            lat: initConfig.mission_templates?.[0]?.target_location?.lat ?? 0.0, 
            lng: initConfig.mission_templates?.[0]?.target_location?.lng ?? 0.0, 
            alt: initConfig.mission_templates?.[0]?.target_location?.alt ?? 0.0, 
            // alt: 0.00 
        }

    },
}

export default stateSchema;
