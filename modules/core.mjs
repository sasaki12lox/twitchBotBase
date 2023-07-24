/**
 * @typedef {{
 *      getMongo: () => import('mongodb').MongoClient
 * }} ModuleMethods
 * @typedef {{}} Variables
 */

import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://0.0.0.0:27017');

/**@type {import('../types').Module<ModuleMethods, import('../index.mjs').SharedMethods, Variables>} */
export default {
    name: 'core',
    requiredVariables: {},
    async prepared() {
        await client.connect();
    },
    methods: {
        getMongo() {
            return client;
        }
    }
}