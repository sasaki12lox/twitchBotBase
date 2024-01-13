import { BotClient } from './botWsControlClient.mjs';
import { MongoClient } from "mongodb";
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibG9naW4iOiJMQm90IiwibW9kIjpmYWxzZSwiYm90Ijp0cnVlLCJpYXQiOjE2OTIwNDg1NTR9.XDa5guzcRBmibX9A6BxARAf14MwfQsC3UGUgFaICCUI'


/**
 * @callback StartBot
 * @param {import('mongodb').Collection<import('./Bot.mjs').BotOptions>} settingsCollection
 * @returns {Promise<{bot: import('./Bot.mjs').Bot}>}
 * 
 */

export default class Integration {

    badStartsCount = 0;

    /**@type {Number} */
    startTime = Date.now();
    
    wsClient = new BotClient('ws://localhost:3000/botws/', token);
    /**@type {StartBot} */
    startBot = null;
    /**
     * 
     * @param {StartBot} startBot
     * @param {string} botName 
     */
    constructor(startBot, botName) {
        this.startBot = startBot;
        this.botName = botName;
    }

    /**@type {import('mongodb').Collection<import('./Bot.mjs').BotOptions>} */
    botSettingsCollection = null;
    /**@type {string} */
    botName = null;
    /**@type {import('./Bot.mjs').Bot} */
    bot = null;

    /**
     * 
     * @param {string} msg 
     */
    #log(msg) {
        console.log(`\x1b[36minteg:log     |\x1b[0m ${msg}`);
    }

    /**
     * 
     * @param {string} msg 
     */
    #errorLog(msg) {
        console.log(`\x1b[31minteg:err     |\x1b[0m ${msg}`);
    }

    /**
     * 
     * @param {string} msg 
     */
    #warningLog(msg) {
        console.log(`\x1b[33minteg:war     |\x1b[0m ${msg}`);
    }

    async #startWithoutIntegration() {
        this.#log('Start bot without integretion');
        this.startBot(this.botSettingsCollection);
    }

    /**
     * @param {import('./Bot.mjs').BotOptions} newSettings
     */
    async #updateBotSettings(newSettings) {
        await this.botSettingsCollection.findOneAndUpdate({name: this.botName}, {
            $set: {
                settings: newSettings.settings,
                variables: newSettings.variables
            }
        });

        this.#log('New settings for bot loaded');
    }

    /**@return {Promise<import('./Bot.mjs').BotOptions>} */
    async #getCurrentBotSettings() {
        return this.botSettingsCollection.findOne({name: this.botName});
    }

    async #start() {
        try {
            this.bot = (await this.startBot(this.botSettingsCollection)).bot;
            this.bot.on('error', (error) => {
                this.#errorLog(`Bot error: ${error}`);
            });
            // this.startTime = Date.now();
            // setInterval(this.sendStat.bind(this), 60000);
        } catch (error) {
            this.badStartsCount++;
            this.#errorLog(`Bot error: ${error}`);
            if (error == 'Login authentication failed') {
                this.#warningLog('Waiting for new token from server');
                this.wsClient.tokenError();
                this.wsClient.on('updateToken', async (tokenData) => {
                    this.#log('Get new token from server');
                    let curSettings = await this.#getCurrentBotSettings();

                    curSettings.settings.client_id = tokenData.client_id;
                    curSettings.settings.token = tokenData.token;

                    await this.#updateBotSettings(curSettings);

                    this.wsClient.emit('reboot');
                });
            }
            else this.wsClient.error(error);
        }
    }

    async sendStat() {
        this.wsClient.sendStat({
            code: 1,
            detaled: {
                uptime: this.startTime - Date.now()
            }
        })
    }

    async start() {
        const mongo = new MongoClient('mongodb://0.0.0.0:27017');
        this.#log('Connecting to mongo');

        await mongo.connect();

        this.#log('Connected successfully');

        /**@type {import('mongodb').Collection<import('./Bot.mjs').BotOptions>} */
        this.botSettingsCollection = mongo.db('bot_settings').collection('settings');

        this.wsClient.on('error', (error) => {
            this.#errorLog(error);
            this.#startWithoutIntegration();
        })

        this.wsClient.on('connected', (msg) => {
            this.#log(`Connected successfully. msg from server: "${msg}"`);

            this.#start();
        });

        this.wsClient.on('start', async () => {
            if (this.bot) return;
            this.badStartsCount = 0;
            this.#start();
        });

        this.wsClient.on('stop', async () => {
            if (!this.bot) return;
            await this.bot.client.disconnect();
            delete this.bot;
        });

        this.wsClient.on('reboot', async () => {
            this.#warningLog('Reboot bot');
            if(this.badStartsCount < 10) this.#start();
            else this.#warningLog('Too much bot reloads');
            if(this.bot) {
                await this.bot.client.disconnect();
                delete this.bot;
            }
        });

        this.#log('Connecting to integration server');
        try {
            await this.wsClient.connect();
        } catch (error) {
            this.wsClient.emit('error', error);
        }
    }
}