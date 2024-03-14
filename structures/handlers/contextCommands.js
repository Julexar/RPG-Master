import Ascii from 'ascii-table';
import { client } from '../..';
import { commands } from '../../commands/context';

class contextHandler {
    static async run() {
        const contextCommandsTable = new Ascii('Context Commands').setHeading('Name', 'Status', 'Reason');

        for (const command of commands) {
            let name;

            if (!command.name || !command.run) return contextCommandsTable.addRow(`${command.name}`, 'Failed', 'Missing Name/Run');

            name = command.name;

            if (command.nick) name += ` (${command.nick})`;

            if (!command.enabled) return contextCommandsTable.addRow(`${name}`, 'Failed', 'Disabled');

            client.contextCommands.set(command.name, command);

            contextCommandsTable.addRow(name, 'Success');
        }

        console.log(contextCommandsTable.toString());
    }
}

const handler = contextHandler;

export { handler };
