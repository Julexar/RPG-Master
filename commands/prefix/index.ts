import fs from 'fs';

const commands: any[] = [];

const dirs = fs.readdirSync('./commands/prefix');

for (const dir of dirs) {
    const files = fs.readdirSync(`./commands/prefix/${dir}`).filter(file => file.endsWith('.ts'));

    for (const file of files) {
        const module = await import(`./commands/prefix/${dir}/${file}`);
        const command = module.command;
        commands.push(command);
    }
}

export { commands };