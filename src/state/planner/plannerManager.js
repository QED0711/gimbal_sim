
import Spiccato from 'spiccato';

import stateSchema from './stateSchema'
import getters from './getters'
import setters from './setters'
import methods from './methods'


const plannerManager = new Spiccato(stateSchema, {id: "planner", enableWriteProtection: false})

// Uncomment below to connect state to localStorage
/*
plannerManager.connectToLocalStorage({ 
    persistKey: "planner"
})
*/

plannerManager.init(); // IMPORTANT: This must be called prior to addCustomGetters and addCustomSetters

plannerManager.addCustomGetters(getters)
plannerManager.addCustomSetters(setters)
plannerManager.addCustomMethods(methods)

export default plannerManager; 
export const plannerPaths = plannerManager.paths;

window._plannerManager = plannerManager;