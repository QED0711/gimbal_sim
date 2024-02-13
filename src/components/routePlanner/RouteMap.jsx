import { useEffect } from 'react';
import * as Cesium from 'cesium';

// =================================== STATE =================================== 
import { useSpiccatoState } from 'spiccato-react';
import mainManager from '../../state/main/mainManager';
import plannerManager from '../../state/planner/plannerManager';

export default function RouteMap() {
    // const {state: plannerState} = useSpiccatoState(plannerManager, [])

    // EFFECTS
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
                creditContainer: undefined, // Specify an element to place the Cesium credit text
            })


            const imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            });
            viewer.imageryLayers.addImageryProvider(imageryProvider);
            debugger
            const aircraftEntity = viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    const position = plannerManager.getters.getPosition();
                    // console.log({position})
                    return Cesium.Cartesian3.fromDegrees(position.lng, position.lat, 10)
                }, false),
                ellipsoid: {
                    radii: new Cesium.Cartesian3(100.0, 100.0, 100.0),
                    material: Cesium.Color.RED.withAlpha(1.0),
                },
            })

            await new Promise(r => setTimeout(r, 1000));
            const position = plannerManager.getters.getPosition();
            viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(position.lng, position.lat, 5000), duration: 0 })
        }
        exec();

    }, [])

    // position tracking
    // useEffect(() => {
    //     console.log(plannerState.position)
    // }, [plannerState.position])

    return (
        <div id="route-map" className='w-screen h-screen overflow-y-hidden'></div>
    )
}