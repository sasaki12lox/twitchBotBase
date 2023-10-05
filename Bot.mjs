import { Client } from 'tmi.js';

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

export class Bot {
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
        this.client = new Client({
            channels: opts.settings.channels,
            identity: {
                password: opts.settings.token,
                username: opts.settings.username
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
        let start = performance.now();

        for (let module of modules) {
            next(module.name);
            await this.loadModule(module);
        }

        remove();
        console.log(`\x1b[36mbot       |\x1b[0m All modules prepared in ${performance.now() - start}ms`);
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
            module.messageBehavorCallback(channel, tags, msg, self, this.client, this.modulesMethods);
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

/**
 * 
 * @param {String} name 
 * @param {string} title
 * @returns {{
*      remove: () => void
*      next: (name: string) => void
* }}
*/
function loadAnimation(title,name) {
    const frames = '⠤⠦⠧⠇⠏⠋⠉⠙⠹⠸⠼⠴';
    const stickLen = 10;
    let i = 0;
    let start = Date.now();
    process.stdout.columns;

    if (title.length < stickLen)
        title += ((new Array(stickLen - title.length)).fill(' ').join('')) + '|';

    let interval = setInterval(() => {
        let str = `\x1b[36m${title} \x1b[32m${frames[i++%frames.length]} \x1b[34m${name}\x1b[0m`;
        let rawStr = `${title} ${frames[i++%frames.length]} ${name}`;
        const time = '\x1b[36m' + ((Date.now()-start)/1000).toFixed(1) + 's\x1b[0m';
        let rawTime = ((Date.now()-start)/1000).toFixed(1);
        str += ' '.repeat(process.stdout.columns - rawStr.length - rawTime.length - 1) + time;
        process.stdout.write(`\n${str}\n`);
        process.stdout.moveCursor(0, -2);
    }, 50);

    return {
        remove: () => {
            clearInterval(interval);
            for (let i = 0; i < 2; i++) {
                process.stdout.clearLine(0);
                process.stdout.moveCursor(0, 1);
            }
            process.stdout.moveCursor(0, -2);
        }, next: (e) => {
            name = e;
            start = Date.now();
        }
    };
}