import * as Cesium from "cesium";
import { useEffect } from "react";
import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../state/main/mainManager";

export default function MapContainer() {
    // STATE
    const { state } = useSpiccatoState(mainManager, [mainPaths.map, mainPaths.isPaused, mainPaths.startPosition, mainPaths.entity]);

    // EFFECTS
    useEffect(() => {
        window.CESIUM_BASE_URL = "/cesium";
        const viewer = new Cesium.Viewer("map", {
            // imageryProvider: new Cesium.UrlTemplateImageryProvider({url: "https://a.tile.openstreetmap.org/"}),
            imageryProvider: undefined,
            animation: false, // Don't create an animation widget
            baseLayerPicker: false, // Don't create a base layer picker widget
            fullscreenButton: false, // Don't create a full screen button widget
            vrButton: false, // Don't create a VR button widget
            geocoder: false, // Don't create a geocoder widget
            homeButton: false, // Don't create a home button widget
            infoBox: false, // Don't create an info box widget
            sceneModePicker: false, // Don't create a scene mode picker widget
            selectionIndicator: false, // Don't create a selection indicator widget
            timeline: false, // Don't create a timeline widget
            navigationHelpButton: false, // Don't create a navigation help button widget
            navigationInstructionsInitiallyVisible: false,
            scene3DOnly: true, // Use a 3D only scene mode
            creditContainer: undefined, // Specify an element to place the Cesium credit text
        });

        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
        });
        viewer.imageryLayers.addImageryProvider(imageryProvider);

        mainManager.setters.setMap(viewer);

    

    }, []);

    useEffect(() => {
        if(!!state.map) {
            const aircraftEntity = state.map.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    const position = mainManager.getters.getPosition();
                    return Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt)
                }, false),
                // position: Cesium.Cartesian3.fromDegrees(state.startPosition.lng, state.startPosition.lat, state.startPosition.alt),
                ellipsoid: {
                    radii: new Cesium.Cartesian3(10.0, 10.0, 10.0),
                    material: Cesium.Color.RED.withAlpha(0.75)
                }
            })
            mainManager.setters.setEntity(aircraftEntity);
            state.map.trackedEntity = aircraftEntity;
            setTimeout(mainManager.methods.updateCamera, 500)
            // mainManager.methods.updateCamera();
        }

    }, [state.map, state.startPosition])

    useEffect(() => {
        if (!!state.map) {
            if(!state.isPaused && !window._updateInterval){
                window._updateInterval = setInterval(mainManager.methods.updateAircraftPosition, 33)
            } else {
                clearInterval(window._updateInterval);
                window._updateInterval = null;
                window._lastPositionUpdate = null;
            }
            // mainManager.methods.updateAircraftPosition();
        }
    }, [state.isPaused, state.map]);

    return <div id="map" className="w-screen h-screen"></div>;
}
