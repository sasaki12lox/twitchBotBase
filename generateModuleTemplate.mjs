import * as fs from 'fs';

const pathToModules = './modules/';

const rawArgs = process.argv.slice(2).join(' ');
const args = rawArgs.slice(rawArgs.split(' ')[0].length+1);
const name = rawArgs.split(' ')[0];

let variables = {};

if (args && args.startsWith('v')) {
    let rawArgs = args.split(' ').slice(1);
    
    for (let v of rawArgs) {
        if (!['s', 'n', 'n.', 's.'].includes(v.split(':')[1])) {
            throw new Error(`Unknow type: ${v}`);
        }

        variables[v.split(':')[0]] = v.split(':')[1];
    }
}

if (!name || name == 'v') {
    throw new Error(`Cannot create module without name`);
}

const template = `
/**
 * @typedef {{}} ModuleMethods
 * @typedef {${JSON.stringify(variables)}} Variables
 */

/**@type {import('../types').Module<ModuleMethods, import('../autoGeneratedTypes.mjs').SharedMethods, Variables>} */
export default {
    name: '${name}',
    requiredVariables: ${JSON.stringify(variables)},
    prepared(mm, client) {
        
    }
}
`;

fs.writeFileSync(pathToModules + (name.toLocaleLowerCase().split('').map((e,i) => i == 0 ? e.toUpperCase() : e).join('')) + '.mjs', template);

let arr = [];

(async () => {
    for (let module of fs.readdirSync('./modules')) {
        let name = (await import(`./modules/${module}`)).default.name;

        arr.push(` *    ${name}: import('./modules/${module}').ModuleMethods`);
    }

    fs.writeFileSync('./autoGeneratedTypes.mjs', `/**\n * @typedef {{\n${arr.join('\n')}\n * }} SharedMethods\n */`);
})()
