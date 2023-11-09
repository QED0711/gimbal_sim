import * as Cesium from "cesium";
import { useEffect } from "react";
import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../state/main/mainManager";

export default function MapContainer() {
    // STATE
    const { state } = useSpiccatoState(mainManager, [mainPaths.map, mainPaths.isPaused]);

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
        if (!!state.map) {
            const initialPosition = Cesium.Cartesian3.fromDegrees(-77.229176, 38.864188, 15000);
            const heading = Cesium.Math.toRadians(270);
            const pitch = Cesium.Math.toRadians(0);
            const roll = Cesium.Math.toRadians(0);

            state.map.camera.setView({
                destination: initialPosition,
                orientation: { roll, pitch, heading },
            });

        }
    }, [state.map]);

    useEffect(() => {
        if (!!state.map) {
            mainManager.methods.simulateFlight();
        }
    }, [state.isPaused, state.map]);

    return <div id="map" className="w-screen h-screen"></div>;
}
