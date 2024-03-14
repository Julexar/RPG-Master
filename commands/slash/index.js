import fs from 'fs';

const commands = [];

const dirs = fs.readdirSync('./commands/slash');
for (const dir of dirs) {
    const files = fs.readdirSync(`./commands/slash/${dir}`);
    for (const file of files) {
        const module = await import(`./${dir}/${file}`);
        const command = module.command;

        commands.push(command);
    }
}

export { commands };
