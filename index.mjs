/**
 * @typedef {{}} SharedMethods
 */

import { Bot } from "./Bot.mjs";
import Integration from "./Integration.mjs";
import { MongoClient } from "mongodb";

import Core from "./modules/Core.mjs";
import Commands from "./modules/Commands.mjs";

const botName = 'TBot';

const modules = [Core, Commands];

/**@type {import('./Integration.mjs').StartBot} */
async function startBot(settingsCollection) {
    // const mongo = new MongoClient('mongodb://0.0.0.0:27017');

    // await mongo.connect();

    // /**@type {import('mongodb').Collection<import('./Bot.mjs').BotOptions>} */
    // const settingsCollection = await mongo.db('bot_settings').collection('settings');
    const settings = await settingsCollection.findOne({name: botName});

    if (!settings) {
        throw new Error(`Cannot find setting for ${botName}`);
    }

    console.log(`\x1b[36mindex         |\x1b[0m Settings for ${botName} loaded, preparing modules`);

    // mongo.close();

    const bot = new Bot(settings);

    await bot.loadModules(modules);
    
    console.log(`\x1b[36mindex         |\x1b[0m Connecting to twitch`);

    await bot.connect();

    console.log(`\x1b[36mindex         |\x1b[0m Connected to twitch (channels: ${settings.settings.channels.join(' ')}) as ${settings.settings.username}`);

    return {
        bot
    };
}


async function main() {
    const cli = new Integration(startBot, botName);

    cli.start();
}

main();