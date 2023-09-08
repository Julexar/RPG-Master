import { glob } from 'glob';
import { promisify } from 'node:util';
const promiseGlob = promisify(glob);
import Ascii from 'ascii-table';

/**
 * 
 * @param {import('../../index')} client 
 */
export default async (client) => {
  console.log("Slash Handler loaded");
  const slashCommandsTable = new Ascii('Slash Commands').setHeading('Name', 'Status', 'Reason');
  (await promiseGlob(`${process.cwd().replace(/\\/g, '/')}/commands/slash/*/*.js`)).map(async (file) => {
    const command = await import(file);
    const P = file.split('/');
    let name;

    if (!command.name || !command.run) {
      return slashCommandsTable.addRow(`${command.name || `${P[P.length - 1]}/${P[P.length - 2]}`}`, 'Failed', 'Missing Name/Run');
    }

    if (command.nick) {
      name = `${command.name} (${command.nick})`;
    } else {
      name = command.name;
    }

    if (!command.enabled) {
      return slashCommandsTable.addRow(`${name}`, "Failed", "Disabled");
    }

    client.slashCommands.set(command.name, command);
    slashCommandsTable.addRow(name, 'Success');
  });
  console.log(slashCommandsTable.toString());
};