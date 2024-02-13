import FlightManager from "../managers/FlightManager"
import MapContainer from "./MapContainer"
import OverlayHUD from "./OverlayHUD"
import ControlsContainer from "./controls/ControlsContainer"
import FooterControls from "./footerControls"

export default function SimulatorContainer() {
    return (
        <>
            <FlightManager />
            <MapContainer />
            <OverlayHUD />
            <ControlsContainer />
            <FooterControls />
        </>
    )
}