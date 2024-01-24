import Ascii from 'ascii-table';
import { client } from '../..';
import { commands } from '../../commands/slash'

class slashHandler {
    static async run() {
        const slashCommandsTable = new Ascii('Slash Commands').setHeading('Name', 'Status', 'Reason');
        
        for (const command of commands) {
            let name;

            if (!command.name || !command.run) return slashCommandsTable.addRow(`${command.name}`, 'Failed', 'Missing Name/Run');

            name = command.name;

            if (command.nick) name += ` (${command.nick})`;

            if (!command.enabled) return slashCommandsTable.addRow(`${name}`, 'Failed', 'Disabled');

            client.slashCommands.set(command.name, command);
            slashCommandsTable.addRow(name, 'Success');
        }

        console.log(slashCommandsTable.toString());
    }
}

const handler = slashHandler

export { handler };