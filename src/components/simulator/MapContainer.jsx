import { useEffect, useState, useRef } from "react";
import * as Cesium from "cesium";


// ========================== TAURI ========================== 
import { invoke } from "@tauri-apps/api";
import { WebviewWindow } from '@tauri-apps/api/window';

// ========================== STATE ========================== 
import { useSpiccatoState } from "spiccato-react";
import mainManager, { mainPaths } from "../../state/main/mainManager";

// ========================== ICONS ========================== 
import { FaMapLocationDot, FaMinimize, FaMinus, FaPlus } from "react-icons/fa6";

// ========================== CONSTANTS ========================== 
import { CAMERA_TYPE, GAMEPAD_TYPE, isEarlySecondOfMinute } from '../../utils/general'
import { setSunlitTime } from "../../utils/map";

export default function MapContainer() {
    // STATE
    const { state } = useSpiccatoState(mainManager, [
        mainPaths.map,
        mainPaths.isPaused,
        mainPaths.startPosition,
        mainPaths.entity,
        mainPaths.includeHud,
        mainPaths.atmosphere,
        mainPaths.imageryLayer,
        mainPaths.gamepadType,
        mainPaths.cameraType,
        mainPaths.clouds,
        mainPaths.selectedMissionIndex,
        mainPaths.sendCot,
        mainPaths.moversActive,
        mainPaths.trackVehicle,
        mainPaths.trackVehicleIndex,
        mainPaths.manualAltCorrection,
    ]);
    const [record, setRecord] = useState(false);
    const [imageQuality, setImageQuality] = useState(0.3);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const cotIntervalRef = useRef(null);

    // EVENTS
    const handleOpenRoutePlanner = () => {
        const webview = new WebviewWindow("routePlanner", {
            "url": "/route-planner",
            "label": "route-planner",
            "title": "Route Planner",
            "fullscreen": false,
            "resizable": true,
            "width": 800,
            "height": 600,
        })
        webview.once("tauri://created", function () {
            console.log("CREATED NEW WINDOW");
        })
        webview.once('tauri://error', function (e) {
            console.log(e)
        })
    }

    // RENDERERS
    const renderOptions = (ops) => {
        return Object.values(ops).map(op => (
            <option key={op} value={op}>{op}</option>
        ))
    }

    // EFFECTS
    useEffect(() => {
        const exec = async () => {

            window.CESIUM_BASE_URL = "/cesium";

            let TERRAIN = {}
            Cesium.Ion.defaultAccessToken = window._initConfig.ion_access_token;
            TERRAIN = { terrain: Cesium.Terrain.fromWorldTerrain() }

            const viewer = new Cesium.Viewer("map", {
                contextOptions: {
                    webgl: {
                        preserveDrawingBuffer: true,
                    },
                },
                // imageryProvider: new Cesium.UrlTemplateImageryProvider({url: "https://a.tile.openstreetmap.org/"}),
                imageryProvider: undefined,
                // ...TERRAIN,
                terrain: !!window._initConfig.ion_access_token ? Cesium.Terrain.fromWorldTerrain() : undefined, // THIS IS THE DEFAULT WORKING ONE
                // terrainProvider: TERRAIN,
                // terrainProvider: Cesium.CesiumTerrainProvider.fromUrl("https://localhost/vector_maps_files/quantized_mesh_12", {requestVertexNormals: true }),
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
                creditContainer: document.createElement("div"), // Specify an element to place the Cesium credit text
            });

            viewer.scene.globe.enableLighting = true;


            const imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: window._initConfig.background_tile_url ?? "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
            });
            const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
            mainManager.setters.setImageryLayer(imageryLayer)

            viewer.camera.frustum.fov = Cesium.Math.toRadians(60.0); // set the default fov

            viewer.scene.globe.maximumScreenSpaceError = 1;

            mainManager.setters.setMap(viewer);

            viewer.canvas.addEventListener("webglcontextlost", e => {
                e.preventDefault()
                console.warn("WEBGL CONTEXT LOST")
                mainManager.setters.setValidWebGlContext(false);
            })

            viewer.canvas.addEventListener("webglcontextrestored", () => {
                console.log("WEB-GL CONTEXT RESTORED")
                mainManager.setters.setValidWebGlContext(true);
            })
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
                    material: Cesium.Color.WHITE.withAlpha(0.0),
                },
            });
            mainManager.setters.setEntity(aircraftEntity);
            state.map.trackedEntity = aircraftEntity;
            setTimeout(mainManager.methods.updateCamera, 500);

            mainManager.methods.updateCloudLayers();
        }
    }, [state.map]);

    // update aircraft position
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

    // turn on/off recording
    useEffect(() => {
        const exec = async () => {
            clearInterval(window._recordingInterval);
            // clearInterval(window._hudInterval);
            clearInterval(window._metadataInterval);
            if (record) {
                const success = await invoke("start_pipeline");
                console.log({ success });

                window._recordingInterval = setInterval(() => { mainManager.methods.sendImage(imageQuality) }, 1000 / window._initConfig?.fps ?? 20);
                // window._hudInterval = setInterval(() => { mainManager.methods.sendHud(imageQuality) }, 1000 / window._initConfig?.hud_fps ?? 5);
                window._metadataInterval = setInterval(() => { mainManager.methods.sendMetadata() }, (1000 / window._initConfig?.fps ?? 20) / 1); // metadata sent at 2 times the rate of video
                // window._metadataInterval = setInterval(() => { mainManager.methods.sendMetadata() }, 1000 / fps); 
            }
        }

        exec();

    }, [record, imageQuality]);

    // render vehicles
    useEffect(() => {
        const exec = async () => {
            const mission = mainManager.getters.getSelectedMission();
            if (state.map && mission) {
                const position = mainManager.getters.getPosition()
                setSunlitTime(position.lat, position.lng)
                mainManager.vehicles.clearAllVehicles();
                for (let i = 0; i < mission.vehicles.length; i++) {
                    const vehicle = mission.vehicles[i];

                    if (vehicle.convoy_num > 1) {
                        for (let vNum = 0; vNum < vehicle.convoy_num; vNum++) {
                            mainManager.vehicles.registerVehicleModel(vehicle, `${i}-${vNum}`, vNum * vehicle.convoy_delay);
                        }
                    } else {
                        mainManager.vehicles.registerVehicleModel(vehicle, `${i}`);
                    }
                }
            }
        }
        exec();
    }, [state.selectedMissionIndex, state.map])

    useEffect(() => {
        clearInterval(cotIntervalRef.current)
        if (state.sendCot) {
            cotIntervalRef.current = setInterval(mainManager.vehicles.sendCotMessages, 333)
        }
    }, [state.sendCot])

    // EO/IR 
    useEffect(() => {
        if (state.imageryLayer) {
            if (state.cameraType === CAMERA_TYPE.EO) {
                state.imageryLayer.brightness = 1.0;
                state.imageryLayer.contrast = 1.0;
                state.imageryLayer.saturation = 1.0;
            } else if (state.cameraType === CAMERA_TYPE.IR) {
                state.imageryLayer.brightness = 0.8;
                state.imageryLayer.contrast = 2.0;
                state.imageryLayer.saturation = 0.0;
            }
        }
    }, [state.cameraType, state.imageryLayer])



    return (
        <>
            <div id="map" className="w-screen h-screen"></div>
            <div className="fixed top-1 right-1 w-[15vw] bg-gray-300 z-50 p-1 rounded-md cursor-pointer shadow-md shadow-gray-500 backdrop-blur-md bg-opacity-50">
                <button className="block w-full text-xl cursor-pointer" onClick={() => { setShowSettingsPanel(b => !b) }}>
                    {
                        showSettingsPanel
                            ? <FaMinus className="float-right" />
                            : <FaPlus className="float-right" />
                    }
                </button>
                {
                    showSettingsPanel
                    &&
                    <>
                        <button className="bg-gray-100 px-1 rounded-sm shadow-sm shadow-black" onClick={() => setRecord(r => !r)}>
                            {record ? "STOP" : "START"} RECORDING
                        </button>
                        <em className="block text-left text-sm text-black">udp://{window._initConfig.stream_address}:{window._initConfig.stream_port}</em>
                        <em className="block text-left text-sm text-black">fps: {window._initConfig.fps}</em>
                        <hr />
                        <label className="block">
                            <input className="ml-2" type="checkbox" checked={state.includeHud} onChange={e => mainManager.setters.setIncludeHud(e.target.checked)} />
                            HUD Overlay
                        </label>
                        <label className="block py-1 border-t border-gray-500">
                            Quality
                            <input
                                className="ml-1 mb-1 px-1 rounded-sm"
                                type="number"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={imageQuality}
                                onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                            />
                        </label>
                        <label className="block py-1">
                            Alt Correction
                            <input
                                className="max-w-[4rem] ml-1 mb-1 px-1 rounded-sm"
                                type="number"
                                step="1"
                                max="9999"
                                value={state.manualAltCorrection}
                                onChange={(e) => {
                                    const correction = Number(e.target.value)
                                    if (!isNaN(correction)) mainManager.setters.setManualAltCorrection(Number(e.target.value))
                                }}
                            />
                        </label>
                        <div className="block border-t border-gray-500">
                            Clouds
                            <label className="grid grid-cols-12">
                                <h3 className="col-span-2">lw:</h3>
                                <input
                                    className="relative top-1 left-2 col-span-6"
                                    type="range"
                                    min="0"
                                    max="1.0"
                                    step="0.01"
                                    value={state.clouds.low.alpha}
                                    onChange={(e) => { mainManager.setters.changeCloudLevelOpacity("low", Number(e.target.value)) }}
                                />
                            </label>
                            <label className="grid grid-cols-12">
                                <h3 className="col-span-2">md:</h3>
                                <input
                                    className="relative top-1 left-2 col-span-6"
                                    type="range"
                                    min="0"
                                    max="1.0"
                                    step="0.01"
                                    value={state.clouds.medium.alpha}
                                    onChange={(e) => { mainManager.setters.changeCloudLevelOpacity("medium", Number(e.target.value)) }}
                                />
                            </label>
                            <label className="grid grid-cols-12">
                                <h3 className="col-span-2">hi:</h3>
                                <input
                                    className="relative top-1 left-2 col-span-6"
                                    type="range"
                                    min="0"
                                    max="1.0"
                                    step="0.01"
                                    value={state.clouds.high.alpha}
                                    onChange={(e) => { mainManager.setters.changeCloudLevelOpacity("high", Number(e.target.value)) }}
                                />
                            </label>
                        </div>
                        <label className="block w-full py-1 border-t border-gray-500">
                            <select onChange={e => mainManager.setters.setGamepadType(e.target.value)} value={state.gamepadType}>
                                {renderOptions(GAMEPAD_TYPE)}
                            </select>
                        </label>
                        <label className="block w-full py-1 border-t border-gray-500">
                            <select onChange={e => mainManager.setters.setCameraType(e.target.value)} value={state.cameraType}>
                                {renderOptions(CAMERA_TYPE)}
                            </select>
                        </label>
                        <hr />
                        <label>
                            <input type="checkbox" value={state.sendCot} onChange={e => mainManager.setters.setSendCot(e.target.checked)} />
                            Send CoT Tracks
                            <br />
                            <em className="block text-left text-sm text-black">udp://{window._initConfig.cot_address}:{window._initConfig.cot_port}</em>
                        </label>
                        <label>
                            <input type="checkbox" checked={state.moversActive} onChange={e => mainManager.setters.setMoversActive(e.target.checked)} />
                            Activate Movers
                        </label>
                        <label className="block">
                            <input type="checkbox" checked={state.trackVehicle} onChange={e => mainManager.setters.setTrackVehicle(e.target.checked)} />
                            Vehicle Track
                            <input className="ml-1" type="number" min="-1" max="99" value={state.trackVehicleIndex} onChange={e => {
                                const idx = Number(e.target.value)
                                !isNaN(idx) ?  mainManager.setters.setTrackVehicleIndex(idx): mainManager.setters.setTrackVehicleIndex(-1)
                            }} />
                        </label>
                        <button className="px-1 bg-gray-100 rounded-sm shadow-sm shadow-black cursor-pointer" onClick={mainManager.vehicles.resetVehicles}>Reset Movers</button>
                        <hr />
                        <button onClick={handleOpenRoutePlanner} className="px-2 mt-1 bg-gray-100 rounded-sm shadow-sm shadow-black cursor-pointer">
                            <FaMapLocationDot size={"2rem"} className="inline-block cursor-pointer " /> Planner
                        </button>

                    </>
                }

            </div>

        </>
    );
}
