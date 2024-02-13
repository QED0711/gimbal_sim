
import Spiccato from 'spiccato';

import stateSchema from './stateSchema'
import getters from './getters'
import setters from './setters'
import methods from './methods'


const mainManager = new Spiccato(stateSchema, {id: "main", enableWriteProtection: false})

// mainManager.connectToLocalStorage({ 
//     persistKey: "main",
//     providerID: "main",
//     initializeFromLocalStorage: false,
//     clearStorageOnUnload: true,
//     privateState: [
//         mainManager.paths.map,
//         mainManager.paths.hud,
//     ],
//     providerWindow: "main",
//     subscriberWindows: ["route-planner"]
// })

mainManager.init(); // IMPORTANT: This must be called prior to addCustomGetters and addCustomSetters

mainManager.addCustomGetters(getters)
mainManager.addCustomSetters(setters)
mainManager.addCustomMethods(methods)

window._mainManager = mainManager

export default mainManager; 
export const mainPaths = mainManager.paths;
