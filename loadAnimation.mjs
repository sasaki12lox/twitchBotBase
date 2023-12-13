/**
 * 
 * @param {String} name 
 * @param {string} title
 * @returns {{
*      remove: () => void
*      next: (name: string) => void
* }}
*/
export function loadAnimation(title,name) {
    const frames = '⠤⠦⠧⠇⠏⠋⠉⠙⠹⠸⠼⠴';
    const stickLen = 14;
    let i = 0;
    let start = Date.now();
    /**@type {{date: number, name: string}} */
    let prev = null;
    process.stdout.columns;

    if (title.length < stickLen)
        title += ((new Array(stickLen - title.length)).fill(' ').join('')) + '|';

    function render() {
        if (prev) {
            let str = `\x1b[36m${title} \x1b[32m✔ \x1b[34m${prev.name}\x1b[0m`;
            let rawStr = `${title} ✔ ${prev.name}`;
            const time = '\x1b[36m' + ((Date.now()-prev.date)/1000).toFixed(1) + 's\x1b[0m';
            let rawTime = ((Date.now()-prev.date)/1000).toFixed(1);
            str += ' '.repeat(process.stdout.columns - rawStr.length - rawTime.length - 1) + time;
            process.stdout.write(`${str}\n`);
            process.stdout.clearLine(0);
            prev = null;
        }
        let str = `\x1b[36m${title} \x1b[32m${frames[i++%frames.length]} \x1b[34m${name}\x1b[0m`;
        let rawStr = `${title} ${frames[i++%frames.length]} ${name}`;
        const time = '\x1b[36m' + ((Date.now()-start)/1000).toFixed(1) + 's\x1b[0m';
        let rawTime = ((Date.now()-start)/1000).toFixed(1);
        str += ' '.repeat(process.stdout.columns - rawStr.length - rawTime.length - 1) + time;
        process.stdout.write(`\n${str}\n`);
        process.stdout.moveCursor(0, -2);
    }

    let interval = setInterval(render, 50);

    return {
        remove: () => {
            clearInterval(interval);
            prev = {name, date: start};
            render();
            for (let i = 0; i < 2; i++) {
                process.stdout.clearLine(0);
                process.stdout.moveCursor(0, 1);
            }
            process.stdout.moveCursor(0, -2);
        }, next: (e) => {
            prev = {
                date: start,
                name: name + ''
            }
            name = e;
            start = Date.now();
        }
    };
}