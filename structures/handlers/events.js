import { glob } from 'glob';
import { promisify } from 'node:util';
const promiseGlob = promisify(glob);
import Ascii from 'ascii-table';

/**
 * 
 * @param {import('../index')} client 
 */
export default async (client) => {
  console.log("Loading Events");
  const eventsTable = new Ascii('Events').setHeading('Name', 'Status', 'Reason');
  (await promiseGlob(`${process.cwd().replace(/\\/g, '/')}/events/*/*.js`)).map(async (file) => {
    const event = await import(file);
    const P = file.split('/');
    let name;

    if (!event.name || !event.run)
      return eventsTable.addRow(`${event.name || `${P[P.length - 1]}/${P[P.length - 2]}`}`, 'Failed', 'Missing Name/Run');

    if (event.nick)
      name = `${event.name} (${event.nick})`
    else
      name = event.name;

    if (event.once)
      client.once(event.name, (...args) => event.run(...args, client))
    else
      client.on(event.name, (...args) => event.run(...args, client));

    eventsTable.addRow(name, 'Success');
  });
  console.log(eventsTable.toString());
};