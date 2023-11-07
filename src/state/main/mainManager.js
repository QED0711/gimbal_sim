
import Spiccato from 'spiccato';

import stateSchema from './stateSchema'
import getters from './getters'
import setters from './setters'
import methods from './methods'


const mainManager = new Spiccato(stateSchema, {id: "main"})

mainManager.connectToLocalStorage({ 
    persistKey: "main",
    providerID: "main",
    initializeFromLocalStorage: true,
    clearStorageOnUnload: false,
})

mainManager.init(); // IMPORTANT: This must be called prior to addCustomGetters and addCustomSetters

mainManager.addCustomGetters(getters)
mainManager.addCustomSetters(setters)
mainManager.addCustomMethods(methods)

export default mainManager; 
export const mainPaths = mainManager.paths;
