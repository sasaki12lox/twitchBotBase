import { AsyncEventEmitter } from "./async-event-emitter/index.mjs";
import WebSocket from "ws";

/**
 * 
 * @typedef {{
 *      code: number
 *      detailed?: Object
 * }} WsApiBase
 * 
 * @typedef { WsApiBase & {
 *      code: 400
 *      detaled: {
 *          error: String
 *      }
 * }} SendError
 * 
 * @typedef { WsApiBase & {
 *      code: 401
 * }} SendTokenError
 * 
 * @typedef { WsApiBase & {
 *      code: 0
 * }} SendSuccess
 * 
 * @typedef { WsApiBase & {
 *      code: 1
 *      detaled: {
 *          uptime: number
 *      }
 * } | {
 *      code: 2
 *      detaled: {
 *          uptime: number
 *          reloads: number
 *          cmds: number
 *      }
 * }} SendStatistic
 * 
 * @typedef { WsApiBase & {
 *      code: 3
 * }} Reboot
 * 
 * @typedef { WsApiBase & {
 *      code: 4
 *      detaled: {
 *          token: string
 *          client_id: string
 *      }
 * }} TokenUpdate
 * 
 * @typedef { WsApiBase & {
 *      code: 5
 * }} StopCmd
 * 
 * @typedef { WsApiBase & {
 *      code: 6
 * }} StartCmd
 * 
 * @typedef { WsApiBase & {
 *      code: 7
 * }} FullStatCmd
 * 
 * @typedef {{
 *      message: String
 * } | {
 *      code: 403
 *      message: String
 * }} HelloMsg
 * 
 * @typedef { Reboot | SendSuccess | TokenUpdate | StopCmd | StartCmd | FullStatCmd | HelloMsg } GetWsApiEvents
 * @typedef { SendError | SendTokenError | SendStatistic | SendSuccess } ToSendWsApiEvents
 */

/**

->
    errors ✅✅

    token error ✅✅

    statistic (spm send per min): ✅✅
        uptime
        (full stat) ⬇
            reloads
            commands count
    
    cmd succes (if is needed) ✅

<-
    reboot cmd ✅
    token update cmd ✅
    stop ✅
    start ✅
    send full stat ✅

*/


export class BotClient extends AsyncEventEmitter {
    /**@type {String} */
    apiUrl = null;
    
    /**@type {String} */
    token = null;

    /**@type {WebSocket} */
    ws = null;
    /**
     * @param {string} apiUrl 
     * @param {string} token 
     */
    constructor(apiUrl, token) {
        super();
        this.apiUrl = apiUrl;
        this.token = token;
    }

    async connect() {
        this.ws = await new WebSocket(this.apiUrl);
        
        this.ws.on('message', this.handleMessage.bind(this));

        this.ws.on('open', this.#authorize.bind(this));
    }

    async #authorize() {
        this.ws.send(JSON.stringify({
            token: this.token
        }));

        await this.awaitEvent('loggined');
    }

    /**
     * 
     * @param {String} msg 
     */
    handleMessage(msg) {
        /**@type {GetWsApiEvents} */
        const json = JSON.parse(msg);

        if ('message' in json) {
            if ('code' in json) {
                this.emit('error', `invalid integration token`);
            } else {
                this.emit(`connected`, json.message);
            }
            this.emit('loggined');

            return;
        }

        switch (json.code) {
            case 0:
                this.emit('success');
                break;
            case 3:
                this.emit('reboot');
                break;
            case 4:
                this.emit('updateToken', json.detaled);
                break;
            case 5:
                this.emit('stop');
                break;
            case 6:
                this.emit('start');
                break;
            case 7:
                this.emit('getFullStat');
                break;
            default:
                break;
        }
    }

    /**
     * 
     * @param {ToSendWsApiEvents} data 
     */
    #send(data) {
        this.ws.send(JSON.stringify(data));
    }

    /**
     * 
     * @param {String} errorMsg 
     */
    error(errorMsg) {
        this.#send({
            code: 400,
            detaled: {
                error: errorMsg
            }
        });
    }

    tokenError() {
        this.#send({
            code: 401
        });
    }

    /**
     * 
     * @param {SendStatistic} stats 
     */
    sendStat(stats) {
        this.#send({
            code: 1,
            ...stats
        });
    }


}