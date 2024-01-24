import fs from 'fs';

const events = [];

const dirs = fs.readdirSync('./events');
for (const dir of dirs) {
    const files = fs.readdirSync(`./events/${dir}`);
    for (const file of files) {
        const module = await import(`./${dir}/${file}`);
        const event = module.default;

        events.push(event);
    }
}

export { events };