//@ts-check

import { Bot } from './Bot.mjs';

const modules = [
   
]

const bot = new Bot({
    channels: [],
    identity: {
        password: '',
        username: ''
    }
});


bot.connect(modules);