import { invoke } from "@tauri-apps/api";
import * as Cesium from "cesium";
import { calcHeading, calcPitch } from "../../utils/map";

let callCount = 0;
let lastLogTime = Date.now();

const methods = {
    async updateAircraftPosition() {
        if (!this.state.map || this.state.isPaused || !this.state.entity) return;
        const now = Date.now();
        const deltaTime = (now - (window._lastPositionUpdate ?? now - 33)) / 1000;
        window._lastPositionUpdate = Date.now();
        const { aircraft: av, position: currentPosition } = this.state;

        const headingRadians = Cesium.Math.toRadians(av.heading);
        const pitchRadians = Cesium.Math.toRadians(av.pitch);

        const distanceMoved = av.velocity * deltaTime;

        const deltaAltitude = distanceMoved * Math.sin(pitchRadians);
        const horizontalDistance = distanceMoved * Math.cos(pitchRadians);
        const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
        const deltaLatitude = Cesium.Math.toDegrees((horizontalDistance / earthRadius) * Math.cos(headingRadians));
        const deltaLongitude = Cesium.Math.toDegrees(
            (horizontalDistance / (earthRadius * Math.cos(currentPosition.lat))) * Math.sin(headingRadians)
        );

        const lat = currentPosition.lat + deltaLatitude,
            lng = currentPosition.lng + deltaLongitude,
            alt = currentPosition.alt + deltaAltitude;

        await this.setters.setPosition({ lat, lng, alt });

        if (this.state.gimbal.isLocked && this.state.gimbal.target !== null) {
            const heading = calcHeading({ lat, lng, alt }, this.state.gimbal.target);
            const pitch = calcPitch({ lat, lng, alt }, this.state.gimbal.target);

            this.setters.setGimbalHeadingPitch(heading, pitch);
        }

    },

    updateCamera() {
        if (!!this.state.map) {
            const gimbal = this.state.gimbal;
            const camera = this.state.map.camera;

            const curFov = camera.frustum.fov;
            const curFovy = camera.frustum.fovy;

            let heading, pitch;
            heading = Cesium.Math.toRadians(gimbal.heading);
            pitch = Cesium.Math.toRadians(gimbal.pitch);

            camera.lookAt(
                this.state.entity.position.getValue(),
                new Cesium.HeadingPitchRange(heading, pitch, gimbal.range)
            );
            camera.frustum.fov = Cesium.Math.toRadians(60) / gimbal.zoomAmount;
        }
    },

    sendImage(imageQuality) {
        if (!this.state.map) return;

        this.state.map.canvas.toBlob(blob => {
            const reader = new FileReader();

            reader.onload = async function () {
                const arrayBuffer = reader.result;
                const data = Array.from(new Uint8Array(arrayBuffer));
                await invoke("send_video_packet", { imageArr: data });
            }
            reader.readAsArrayBuffer(blob);
        }, "image/jpeg", imageQuality);
    },

    sendHud(imageQuality) {
        if (this.state.includeHud) {
            this.state.hud.toBlob(blob => {
                const reader = new FileReader();

                reader.onload = async function () {
                    const arrayBuffer = reader.result;
                    const data = Array.from(new Uint8Array(arrayBuffer));
                    await invoke("send_hud_packet", { imageArr: data });
                }
                reader.readAsArrayBuffer(blob);
            }, "image/png", imageQuality);
        }
    },

    async sendMetadata() {
        if (!this.state.map) return;

        const metadata = this.getters.getMetadata();
        await invoke("send_metadata_packet", { metadata })
    }
};

export default methods;
