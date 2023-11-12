import { mainPaths } from "./mainManager";

const setters = {

    togglePause() {
        this.setState(prevState => {
            return [{ isPaused: !prevState.isPaused }, [mainPaths.isPaused]];
        })
    },

    increasePitch(amount = 1) {
        this.setState(prevState => ([{ aircraft: { ...prevState.aircraft, pitch: Math.min(prevState.aircraft.pitch + amount, 90) } }, [mainPaths.aircraft.pitch]]));
    },
    decreasePitch(amount = 1) {
        this.setState(prevState => ([{ aircraft: { ...prevState.aircraft, pitch: Math.max(prevState.aircraft.pitch - amount, -90) } }, [mainPaths.aircraft.pitch]]));
    },

    increaseHeading(amount = 1) {
        this.setState(prevState => {
            let heading = (prevState.aircraft.heading + amount) % 360;
            return [
                {aircraft: {...prevState.aircraft, heading}},
                [mainPaths.aircraft.heading]
            ]
        })
    },
    decreaseHeading(amount = 1) {
        this.setState(prevState => {
            let heading = prevState.aircraft.heading - amount;
            if(heading < 0) heading += 360
            return [
                {aircraft: {...prevState.aircraft, heading}},
                [mainPaths.aircraft.heading]
            ]
        })
    },

}

export default setters;
