//@ts-check

/**
 * @callback messageBehavorCallback
 * @param {string} channel
 * @param {import('tmi.js').ChatUserstate} tags
 * @param {string} msg
 * @param {boolean} self
 * @param {import('tmi.js').Client} client
 * @param {{[moduleName: string]: any}} sharedContext
 * @param {{[moduleName: string]: any}} modulesMethods
 * 
 * @callback prepared
 * @param {{[moduleName: string]: any}} sharedContext
 *  
 * @callback updateIntervalCallback
 * @param {any} sharedContext
 * 
 * @typedef {{
 *      messageBehavor?: 'active' | null
 *      messageBehavorCallback?: messageBehavorCallback
 *      methods?: {[name: string]: Function}
 *      name: string
 *      prepared?: prepared
 *      updateInInterval?: boolean
 *      updateInterval?: number
 *      updateIntervalCallback?: updateIntervalCallback
 * }} ModuleOptions
 */

export class ModuleBase {
    /**@param {ModuleOptions} opts */
    constructor (opts) {
        this.messageBehavor = opts.messageBehavor || null;
        this.messageBehavorCallback = opts.messageBehavorCallback || null;
        this.name = opts.name;
        this.methods = opts.methods;
        this.prepared = opts.prepared;
        this.updateInInterval = opts.updateInInterval;
        this.updateInterval = opts.updateInterval;
        this.updateIntervalCallback = opts.updateIntervalCallback;
    }
}