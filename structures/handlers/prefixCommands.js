import Ascii from 'ascii-table';
import { client } from '../..';
import { commands } from '../../commands/prefix';

class prefixHandler {
    static async run() {
        const prefixCommandsTable = new Ascii('Prefix Commands').setHeading('Name', 'Status', 'Reason');
        
        for (const command of commands) {
            let name;

            if (!command.name || !command.run) return prefixCommandsTable.addRow(`${command.name}`, 'Failed', 'Missing Name/Run');

            name = command.name;

            if (command.nick) name += ` (${command.nick})`;

            if (!command.enabled) return prefixCommandsTable.addRow(`${name}`, 'Failed', 'Disabled');

            client.prefixCommands.set(command.name, command);
            prefixCommandsTable.addRow(name, 'Success');
        }

        console.log(prefixCommandsTable.toString());
    }
}

const handler = prefixHandler;

export { handler };