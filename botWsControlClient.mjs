/**
 * 
 * 
 * @typedef {null} WsEvents
 */

export class BotClient {
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
        this.apiUrl = apiUrl;
        this.token = token;
    }

    async connect() {
        this.ws = new WebSocket(this.apiUrl);
        
    }
}