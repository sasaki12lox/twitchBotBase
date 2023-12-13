import { Client } from 'tmi.js';
import { loadAnimation } from './loadAnimation.mjs';
import { AsyncEventEmitter } from './async-event-emitter/index.mjs';

/**
 * @typedef {{
 *      settings: GeneralSettings,
 *      variables: Variables
 * }} BotOptions
 * 
 * @typedef {{[name: string]: string | number | boolean | string[] | number[]}} Variables
 * 
 * @typedef {{
 *      token: string,
 *      channels: string[],
 *      username: string,
 *      client_id: string,
 *      id: string
 *      modules_to_load: string[]
 * }} GeneralSettings
 */

export class Bot extends AsyncEventEmitter {
    /**@type {import('tmi.js').Client | null} */
    client = null;

    /**@type {string[]} */
    loadedModules = [];

    /**@type {import('./types').SharedMethods} */
    modulesMethods = {};

    /**@type {import('./types').MessageBehavorModule[]} */
    messageBehavorModules = [];

    /**@type {GeneralSettings} */
    settings = null;

    /**@type {Variables} */
    variables = null;

    /**
     * 
     * @param {BotOptions} opts 
     */
    constructor(opts) {
        super();
        this.client = new Client({
            channels: opts.settings.channels,
            identity: {
                password: opts.settings.token,
                username: opts.settings.username
            },
            logger: {
                error: () => {},
                info: () => {},
                warn: () => {}
            }
        })
        this.settings = opts.settings;
        this.variables = opts.variables;
    }

    async connect() {
        await this.client.connect();

        this.client.on('message', this.callMassageBehavorModules.bind(this));
    }

    /**
     * 
     * @param {import('./types').Module<any, any, any>[]} modules 
     */
    async loadModules(modules) {
        if (!modules[0]) return;
        let {next, remove} = loadAnimation('bot', modules[0].name);
        let once = true;
        let start = performance.now();

        for (let module of modules) {
            if (!once) next(module.name);
            await this.loadModule(module);
            if (once) once = false;
        }

        remove();
        console.log(`\x1b[36mbot           |\x1b[0m All modules prepared in ${((performance.now() - start)/1000).toFixed(2)}s`);
    }

    /**
     * 
     * @param {import('./types').MessageBehavorModule<any, any, any> | import('./types').ModuleBase<any, any, any>} module 
     */
    async loadModule(module) {
        if (!this.settings.modules_to_load.includes(module.name)) return;

        if (module.dependencies) {
            for (let dependence of module.dependencies) 
                if (!this.loadedModules.includes(dependence)) throw new Error(`\x1b[36mbot       |\x1b[0m Module has depentencies, but loaded modules doesn't have it depentence (${dependence})`);
        }

        if (module.requiredVariables) {
            for (let requiredVariable in module.requiredVariables) {
                if (!this.variables[requiredVariable]) throw new Error(`\x1b[36mbot       |\x1b[0m Module has required variable (${requiredVariable}), but bot doesn't have it.`);

                if (Array.isArray(this.variables[requiredVariable])) {
                    if (module.requiredVariables[requiredVariable][1] != '.') throw new Error(`\x1b[36mbot       |\x1b[0m Module variable (${requiredVariable}) type is not an array, but gived variable is array.`);
                    //@ts-expect-error
                    if (this.variables[requiredVariable].length)
                        //@ts-expect-error
                        checkArrayTypes(this.variables[requiredVariable], module.requiredVariables[requiredVariable], requiredVariable);
                //@ts-expect-error
                } else checkTypes(this.variables[requiredVariable], module.requiredVariables[requiredVariable], requiredVariable);

                if (module.requiredVariables[requiredVariable][1] == '.' && !Array.isArray(this.variables[requiredVariable])) 
                    throw new Error(`\x1b[36mbot       |\x1b[0m Module variable (${requiredVariable}) is array, but gived variable is not array.`);
            }
            module.variables = this.variables;
        }

        if (module.prepared) await module.prepared(this.modulesMethods, this.client);

        if ('messageBehavor' in module) {
            if (module.messageBehavor == 'active') {
                this.messageBehavorModules.push(module);
            }
        }

        if (module.methods) this.modulesMethods[module.name] = module.methods;
    }

    /**
     * 
     * @param {string} module_name
     * @returns {Promise<boolean>}
     */
    async unloadModule(module_name) {
        if (this.loadedModules.includes(module_name)) {
            this.loadedModules.splice(this.loadedModules.indexOf(module_name), 1);
            delete this.modulesMethods[module_name];
            
            let mbm = this.messageBehavorModules.find(e => e.name == module_name);

            if (mbm) this.messageBehavorModules.splice(this.messageBehavorModules.indexOf(mbm), 1);
            
            return true;
        }

        return false;
    }

    /**
     * 
     * @param {string} channel 
     * @param {import('tmi.js').ChatUserstate} tags 
     * @param {string} msg 
     * @param {boolean} self 
     */
    async callMassageBehavorModules(channel, tags, msg, self) {
        for (let module of this.messageBehavorModules) {
            try {
                await module.messageBehavorCallback(channel, tags, msg, self, this.client, this.modulesMethods);
            } catch (error) {
                this.emit('error', error);
            }
        }
    }
}

const shortTypes = {
    'n': 'number',
    's': 'string',
    'b': 'boolean'
}

/**
 * 
 * @param {string[] | number[]} variable 
 * @param {'n.' | 's.'} type
 * @param {string} vname
 */
function checkArrayTypes(variable, type, vname) {
    let short2type = shortTypes[type[0]];

    variable.forEach((e, i) => {if (typeof e != short2type) throw new Error(`\x1b[36mbot   |\x1b[0m Module variable (${vname}) is type ${short2type}[], but gived variable array contains other type at position (${i}).`)});
}

/**
 * 
 * @param {string | number | boolean} variable 
 * @param {'n' | 's' | 'b'} type 
 * @param {string} vname 
 */
function checkTypes(variable, type, vname) {
    let short2type = shortTypes[type[0]];

    if (typeof variable != short2type) throw new Error(`\x1b[36mbot   |\x1b[0m Module variable (${vname}) is type ${short2type}, but gived variable is other tpye.`);
}