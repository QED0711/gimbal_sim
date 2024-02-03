import { useEffect, useState } from "react";
import * as Cesium from "cesium";
import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../state/main/mainManager";

export default function MapContainer() {
    // STATE
    const { state } = useSpiccatoState(mainManager, [
        mainPaths.map,
        mainPaths.isPaused,
        mainPaths.startPosition,
        mainPaths.entity,
    ]);
    const [record, setRecord] = useState(false);
    const [imageQuality, setImageQuality] = useState(0.3);
    const [fps, setFps] = useState(20);

    // EFFECTS
    useEffect(() => {
        const exec = async () => {

            window.CESIUM_BASE_URL = "/cesium";
            Cesium.Ion.defaultAccessToken = window._initConfig.ion_access_token;

            const viewer = new Cesium.Viewer("map", {
                contextOptions: {
                    webgl: {
                        preserveDrawingBuffer: true,
                    },
                },
                // imageryProvider: new Cesium.UrlTemplateImageryProvider({url: "https://a.tile.openstreetmap.org/"}),
                imageryProvider: undefined,
                terrain: !!window._initConfig.ion_access_token ? Cesium.Terrain.fromWorldTerrain() : undefined,
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

            // const terrain = !!window._initConfig.terrain_provider_url
            //     ? await Cesium.CesiumTerrainProvider.fromUrl(window._initConfig.terrain_provider_url, {requestVertexNormals: true})
            //     : new Cesium.EllipsoidTerrainProvider();

            // console.log("TERRAIN", terrain)
            // viewer.terrainProvider = terrain;


            viewer.camera.frustum.fov = Cesium.Math.toRadians(60.0); // set the default fov

            mainManager.setters.setMap(viewer);
        }
        exec();
    }, []);

    // Aircraft Entity
    useEffect(() => {
        if (!!state.map) {
            const aircraftEntity = state.map.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    const position = mainManager.getters.getPosition();
                    return Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt);
                }, false),
                ellipsoid: {
                    radii: new Cesium.Cartesian3(10.0, 10.0, 10.0),
                    material: Cesium.Color.RED.withAlpha(0.0),
                },
            });
            mainManager.setters.setEntity(aircraftEntity);
            state.map.trackedEntity = aircraftEntity;
            setTimeout(mainManager.methods.updateCamera, 500);
        }
    }, [state.map]);

    useEffect(() => {
        if (!!state.map) {
            if (!state.isPaused && !window._updateInterval) {
                window._updateInterval = setInterval(mainManager.methods.updateAircraftPosition, 33);
            } else {
                clearInterval(window._updateInterval);
                window._updateInterval = null;
                window._lastPositionUpdate = null;
            }
            // mainManager.methods.updateAircraftPosition();
        }
    }, [state.isPaused, state.map]);

    useEffect(() => {
        clearInterval(window._recordingInterval);
        clearInterval(window._metadataInterval);
        if (record) {
            window._recordingInterval = setInterval(() => { mainManager.methods.sendImage(imageQuality) }, 1000 / fps);
            window._metadataInterval = setInterval(() => { mainManager.methods.sendMetadata() }, (1000 / fps) / 3); // metadata sent at 3 times the rate of video
        }

    }, [record, imageQuality, fps]);


    return (
        <>
            <div id="map" className="w-screen h-screen"></div>
            <div className="fixed top-1 right-1 bg-gray-300 z-50 cursor-pointer">
                <button className="bg-gray-100" onClick={() => setRecord((val) => !val)}>
                    {record ? "STOP" : "START"} RECORDING
                </button>
                <em className="block text-left text-sm text-black">udp://{window._initConfig.stream_address}:{window._initConfig.stream_port}</em>
                <label>
                    Quality
                    <input
                        type="number"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={imageQuality}
                        onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                    />
                </label>
                <br />
                <label>
                    FPS
                    <input type="number" min="1" value={fps} onChange={(e) => setFps(parseInt(e.target.value))} />
                </label>
                <br/>
            </div>

        </>
    );
}
