import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react"
import { useSpiccatoState } from "spiccato-react";
import plannerManager from '../../state/planner/plannerManager';

export default function EventManager() {


    useEffect(() => {
        const exec = async () => {
            let events;
            switch (window.location.pathname) {
                case "/":
                    break;
                case "/route-planner":
                    events = {
                        positionUpdate({ event, payload }) {
                            plannerManager.setters.setPosition(payload);
                        },

                        aircraftUpdate({payload}) {
                            plannerManager.setters.setAircraft(payload);
                        },

                        targetUpdate({payload}) {
                            plannerManager.setters.setTarget(payload);
                        }
                    }
                    break;
            }

            for (let [eventName, callback] of Object.entries(events)) {
                listen(eventName, callback);
            }
        }

        exec();

    }, [])

    return <></>
}