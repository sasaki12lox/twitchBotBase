//@ts-check

import { Client } from "tmi.js";

export class Bot {

    /**@type {import('./Module.mjs').ModuleBase[]} */
    modules = [];
    /**@type {{[moduleName: string]: any}} */
    sharedContext = {};
    /**@type {{[moduleName: string]: any}} */
    modulesMethods = {};
    /**@type {{[moduleName: string]: NodeJS.Timer}} */
    intervalUpdated = {};

    /**
     * @param {import('tmi.js').Options} clientOpts
     */
    constructor (clientOpts) {
        this.client = new Client(clientOpts);
    }
    
    /**
     * @param {import('./Module.mjs').ModuleBase[]} modules
     */
    async connect(modules) {
        await this.prepareModules(modules)

        await this.client.connect();
        console.log(`Connected to twitch as ${this.client.getUsername()}`);

        this.client.on('message', this.messageHandle.bind(this));
    }
    
    /**
     * @param {string} channel
     * @param {import('tmi.js').ChatUserstate} tags
     * @param {string} msg
     * @param {boolean} self 
     */
    messageHandle(channel, tags, msg, self) {
        let client = this.client;
        
        for (let module of this.modules)
            if (module.messageBehavorCallback) module.messageBehavorCallback(channel, tags, msg, self, client, this.sharedContext, this.modulesMethods);
    }

    /**@param {import('./Module.mjs').ModuleBase} module */
    addToMessageHandleConveyor(module) {
        if (module.messageBehavor == null) return;

        this.modules.push(module);
    }

    /**@param {import('./Module.mjs').ModuleBase[]} modules*/
    async prepareModules(modules) {
        
        let start = performance.now();
        
        for (let module of modules) {
            let rm = preparingModuleAnimation(module.name);
            if (module.prepared) 
            await module.prepared(this.sharedContext);
            
            if (module.messageBehavor != null)
                this.addToMessageHandleConveyor(module);
            
            if (module.methods) 
                this.modulesMethods[module.name] = module.methods;
            
            if (module.updateInInterval && module.updateIntervalCallback && module.updateInterval) 
                this.intervalUpdated[module.name] = setInterval(module.updateIntervalCallback, module.updateInterval);

            rm();
        }
        console.log(`All modules prepared in: ${performance.now() - start}ms`);
    }
}

function preparingModuleAnimation(name) {
    const frames = ['-', '\\', '|', '/'];

    let i = 0;

    process.stdout.write(`Preparing module ${frames[i++]}: ${name}`);

    let interval = setInterval(() => {
        process.stdout.moveCursor(-(name.length + 3), 0);
        process.stdout.write(`${frames[(i++)%frames.length]}`);
        process.stdout.moveCursor((name.length + 2), 0);
    }, 100);

    return () => {
        clearInterval(interval);
        let len = `Preparing module ${frames[i++]}: ${name}`.length;
        process.stdout.moveCursor(-len, 0);
        process.stdout.write(' '.repeat(len));
        process.stdout.moveCursor(-len, 0);
    }
}