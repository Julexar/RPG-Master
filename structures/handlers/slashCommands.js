import Ascii from 'ascii-table';
import fs from 'fs';
import { client } from '../..';

class slashHandler {
    static async run() {
        const slashCommandsTable = new Ascii('Slash Commands').setHeading('Name', 'Status', 'Reason');
        const dirs = fs.readdirSync('./commands/slash');

        for (const dir of dirs) {
            const files = fs.readdirSync(`./commands/slash/${dir}`);

            for (const file of files) {
                const module = await import(`../../commands/slash/${dir}/${file}`);
                const command = module.default;
                let name;

                if (!command.name || !command.run) {
                    return slashCommandsTable.addRow(`${command.name || file}`, 'Failed', 'Missing Name/Run');
                }

                name = command.name;

                if (command.nick) {
                    name += ` (${command.nick})`;
                }

                if (!command.enabled) {
                    return slashCommandsTable.addRow(`${name}`, 'Failed', 'Disabled');
                }

                client.slashCommands.set(command.name, command);
                slashCommandsTable.addRow(name, 'Success');
            }
        }

        console.log(slashCommandsTable.toString());
    }
}

export default slashHandler;