import { mainPaths } from "./mainManager";

const setters = {
    togglePause() {
        this.setState((prevState) => {
            return [{ isPaused: !prevState.isPaused }, [mainPaths.isPaused]];
        });
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
};

export default setters;
