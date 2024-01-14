import {useState, useEffect} from 'react';
import mainManager from '../state/main/mainManager';

export default function useWindowResize(){
    const [windowSize, setWindowSize] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
            mainManager.setters.setImageDimensions({width: window.innerWidth, height: window.innerHeight})
        }

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);

    }, [])

    return windowSize;
}