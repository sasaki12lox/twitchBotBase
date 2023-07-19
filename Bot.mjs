import {Client} from 'tmi.js';

/**
 * @typedef {{
 *      settings: GeneralSettings
 * }} BotOptions
 * 
 * @typedef {{}} GeneralSettings
 */

export class Bot {
    /**@type {import('./types').Module<any, any, any>[]} */
    modules = [];

    /**@type {BotOptions} */
    constructor(opst) {

    }

    /**
     * 
     * @param {import('./types').Module<any, any, any>} module 
     */
    async loadModule(module) {
        
    }

    /**
     * 
     * @param {string} module_name
     * @returns {Promise<boolean>}
     */
    async unloadModule(module_name) {
        return true;
    }


}