import Ascii from 'ascii-table';
import fs from 'fs';
import { client } from '../..';

class prefixHandler {
    static async run() {
        const prefixCommandsTable = new Ascii('Prefix Commands').setHeading('Name', 'Status', 'Reason');
        const dirs = fs.readdirSync('./commands/prefix');

        for (const dir of dirs) {
            const files = fs.readdirSync(`./commands/prefix/${dir}`);

            for (const file of files) {
                const module = await import(`../../commands/prefix/${dir}/${file}`);
                const command = module.default;
                let name;

                if (!command.name || !command.run) return prefixCommandsTable.addRow(`${command.name || file}`, 'Failed', 'Missing Name/Run');

                name = command.name;

                if (command.nick) name += ` (${command.nick})`;

                client.prefixCommands.set(command.name, command);
                prefixCommandsTable.addRow(name, 'Success');
            }
        }

        console.log(prefixCommandsTable.toString());
    }
}

export default prefixHandler;