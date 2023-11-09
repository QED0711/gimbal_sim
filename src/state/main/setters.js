import { mainPaths } from "./mainManager";

const setters = {

    togglePause(){
        this.setState(prevState => {
            return [{isPaused: !prevState.isPaused}, [mainPaths.isPaused]];
        })
    }

}

export default setters;
