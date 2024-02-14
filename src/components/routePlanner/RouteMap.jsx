import { useEffect } from 'react';
import * as Cesium from 'cesium';
// =================================== TUARI =================================== 
import {emit} from '@tauri-apps/api/event';

// =================================== STATE =================================== 
import { useSpiccatoState } from 'spiccato-react';
import plannerManager from '../../state/planner/plannerManager';

// =================================== ICONS =================================== 
import AircraftIcon from '../../assets/aircraft_icon.svg';
import { calcHeading } from '../../utils/map';

const useCanvasPointerEvents = (viewer) => {
    useEffect(() => {
        if(!!viewer) {
            viewer.canvas.addEventListener("pointerup", e => {
                const mapMode = plannerManager.getters.getMapMode();
                if(mapMode === "waypoint") {
                    const waypoint = plannerManager.getters.getCoordinateAtPixel({x: e.clientX, y: e.clientY})
                    const curPosition = plannerManager.getters.getPosition();

                    const heading = calcHeading(curPosition, waypoint);
                    if(!!heading) {
                        emit("waypointHeading", Math.round(heading));
                    }

                    plannerManager.setters.setHeadingWaypoint(waypoint);
                    plannerManager.setters.setMapMode("drag");
                    
                }
            })
        }
    }, [viewer])
}

export default function RouteMap() {
    const {state} = useSpiccatoState(plannerManager, [plannerManager.paths.map])

    // EFFECTS

    useCanvasPointerEvents(state.map)
    // map initialization
    useEffect(() => {
        const exec = async () => {

            const viewer = new Cesium.Viewer("route-map", {
                // imageryProvider: undefined,
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
                scene3DOnly: false, // Use a 3D only scene mode
                sceneMode: Cesium.SceneMode.SCENE2D,
                // creditContainer: "<div>CartoDB</div>", // Specify an element to place the Cesium credit text
            })


            const imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            });
            viewer.imageryLayers.addImageryProvider(imageryProvider);

            const stareLine = viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        const position = plannerManager.getters.getPosition();
                        const target = plannerManager.getters.getTarget();
                        return Cesium.Cartesian3.fromDegreesArray([
                            position.lng, position.lat, target.lng, target.lat
                        ])
                    }, false),
                    material: Cesium.Color.LAWNGREEN,
                    width: 2
                }
            })

            const aircraftEntity = viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    const position = plannerManager.getters.getPosition();
                    return Cesium.Cartesian3.fromDegrees(position.lng, position.lat, 10)
                }, false),
                billboard: {
                    image: AircraftIcon,
                    scale: 0.03,
                    rotation: new Cesium.CallbackProperty(() => {
                        const aircraft = plannerManager.getters.getAircraft();
                        return Cesium.Math.toRadians(360 - aircraft.heading)
                    }, false),
                    pixelOffset: new Cesium.Cartesian2(0,0),
                    eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    heightReference: Cesium.HeightReference.NONE,
                }
            })

            const waypointEntity = viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    const waypoint = plannerManager.getters.getHeadingWaypoint();
                    if(!!waypoint) {
                        return Cesium.Cartesian3.fromDegrees(waypoint.lng, waypoint.lat)
                    } else {
                        return Cesium.Cartesian3.fromDegrees(0.0, 0.0);
                    }
                }, false),
                show: new Cesium.CallbackProperty(() => !!plannerManager.getters.getHeadingWaypoint(), false),
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.BLUE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2
                }

            })


            await new Promise(r => setTimeout(r, 1000));
            const position = plannerManager.getters.getPosition();
            viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(position.lng, position.lat, 5000), duration: 0 })

            plannerManager.setters.setMap(viewer);
        }
        exec();

    }, [])


    useEffect(() => {

    }, [state.map])

    return (
        <div id="route-map" className='w-screen h-screen overflow-y-hidden'></div>
    )
}