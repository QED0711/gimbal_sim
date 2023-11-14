import * as Cesium from 'cesium'
import { mainPaths } from "./mainManager";

const setters = {
    togglePause() {
        this.setState((prevState) => {
            return [{ isPaused: !prevState.isPaused }, [mainPaths.isPaused]];
        });
    },

    toggleGimbalLock(){
        this.setState(prevState => {
            const isLocked = !prevState.gimbal.isLocked;
            if(isLocked) {
                const centerCoord = this.getters.getCoordinateAtPixel({});
                return [
                    {gimbal: {...prevState.gimbal, isLocked, target: centerCoord}},
                    [this.paths.gimbal.isLocked, this.paths.gimbal.target]
                ]
            } else {
                return [
                    {gimbal: {...prevState.gimbal, isLocked}},
                    [mainPaths.gimbal.isLocked]
                ]
            }
        })
    },

    setTargetToCenterScreen(){
        this.setState(prevState => {
            const centerCoord = this.getters.getCoordinateAtPixel({});
            return [
                {gimbal: {...prevState.gimbal, target: centerCoord}},
                [this.paths.gimbal.target]
            ]
        })
    },

    setGimbalHeadingPitch(heading, pitch){
        this.setState(prevState => {
            const camera = this.state.map.camera;
            heading ??= Cesium.Math.toDegrees(camera.heading);
            pitch ??= Cesium.Math.toDegrees(camera.pitch);
            return [
                {gimbal: {...prevState.gimbal, heading, pitch}},
                [mainPaths.gimbal.heading, mainPaths.gimbal.pitch]
            ]
        }, () => {
            this.methods.updateCamera();
        })
    },

    increaseGimbalPitch(amount = 1) {
        this.setState(
            (prevState) => {
                return [
                    { gimbal: { ...prevState.gimbal, pitch: Math.min(prevState.gimbal.pitch + amount, 90) } },
                    [mainPaths.gimbal.pitch],
                ];
            },
            () => {
                if(this.state.gimbal.isLocked) this.setters.setTargetToCenterScreen();
                this.methods.updateCamera();
            }
        );
    },

    decreaseGimbalPitch(amount = 1) {
        this.setState(
            (prevState) => {
                return [
                    { gimbal: { ...prevState.gimbal, pitch: Math.max(prevState.gimbal.pitch - amount, -90) } },
                    [mainPaths.gimbal.pitch],
                ];
            },
            () => {
                if(this.state.gimbal.isLocked) this.setters.setTargetToCenterScreen();
                this.methods.updateCamera();
            }
        );
    },

    increaseGimbalHeading(amount = 1) {
        this.setState(
            (prevState) => {
                let heading = (prevState.gimbal.heading + amount) % 360;
                return [{ gimbal: { ...prevState.gimbal, heading } }, [mainPaths.gimbal.heading]];
            },
            () => {
                this.methods.updateCamera();
            }
        );
    },

    decreaseGimbalHeading(amount = 1) {
        this.setState((prevState) => {
            let heading = prevState.gimbal.heading - amount;
            if (heading < 0) heading += 360;
            return [{ gimbal: { ...prevState.gimbal, heading } }, [mainPaths.gimbal.heading]];
        }, () => {
                this.methods.updateCamera();
        });
    },

    adjustGimbalZoom(amount=100){
        this.setState(prevState => {
            return [
                {gimbal: {...prevState.gimbal, zoomAmount: Math.max(prevState.gimbal.zoomAmount - amount, 0)}},
                [mainPaths.gimbal.zoomAmount]
            ]
        }, () => {
            this.methods.updateCamera();
        })
    },

    increaseAircraftPitch(amount = 1) {
        this.setState((prevState) => [
            { aircraft: { ...prevState.aircraft, pitch: Math.min(prevState.aircraft.pitch + amount, 90) } },
            [mainPaths.aircraft.pitch],
        ]);
    },

    decreaseAircraftPitch(amount = 1) {
        this.setState((prevState) => [
            { aircraft: { ...prevState.aircraft, pitch: Math.max(prevState.aircraft.pitch - amount, -90) } },
            [mainPaths.aircraft.pitch],
        ]);
    },

    increaseAircraftHeading(amount = 1) {
        this.setState((prevState) => {
            let heading = (prevState.aircraft.heading + amount) % 360;
            return [{ aircraft: { ...prevState.aircraft, heading } }, [mainPaths.aircraft.heading]];
        });
    },

    decreaseAircraftHeading(amount = 1) {
        this.setState((prevState) => {
            let heading = prevState.aircraft.heading - amount;
            if (heading < 0) heading += 360;
            return [{ aircraft: { ...prevState.aircraft, heading } }, [mainPaths.aircraft.heading]];
        });
    },

    increaseAircraftVelocity(amount = 1) {
        this.setState(prevState => {
            return [
                {aircraft: {...prevState.aircraft, velocity: prevState.aircraft.velocity + amount}},
                [mainPaths.aircraft.velocity]
            ]
        })
    },

    decreaseAircraftVelocity(amount = 1) {
        this.setState(prevState => {
            return [
                {aircraft: {...prevState.aircraft, velocity: Math.max(prevState.aircraft.velocity - amount, 0)}},
                [mainPaths.aircraft.velocity]
            ]
        })
    },

};

export default setters;
