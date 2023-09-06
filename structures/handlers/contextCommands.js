import { glob } from 'glob';
import { promisify } from 'node:util';
const promiseGlob = promisify(glob);
import Ascii from 'ascii-table';

/**
 * 
 * @param {import('../../index')} client 
 */
export default async (client) => {
  const contextCommandsTable = new Ascii('Context Commands').setHeading('Name', 'Status', 'Reason');
  (await promiseGlob(`${process.cwd().replace(/\\/g, '/')}/commands/context/*/*.js`)).map(async (file) => {
    const command = require(file);
    const P = file.split('/');
    let name;

    if (!command.name || !command.run)
      return contextCommandsTable.addRow(`${command.name || `${P[P.length - 1]}/${P[P.length - 2]}`}`, 'Failed', 'Missing Name/Run');

    if (command.nick)
      name = `${command.name} (${command.nick})`
    else
      name = command.name;

    client.contextCommands.set(command.name, command);
    contextCommandsTable.addRow(name, 'Success');
  });
  console.log(contextCommandsTable.toString());
};