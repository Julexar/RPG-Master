import fs from 'fs';

const events: any[] = [];

const dirs = fs.readdirSync('./events');

for (const dir of dirs) {
    const files = fs.readdirSync(`./events/${dir}`).filter(file => file.endsWith('.ts'));

    for (const file of files) {
        const event = require(`../events/${dir}/${file}`).default;

        events.push(event);
    }
}

export { events };