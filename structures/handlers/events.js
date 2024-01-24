import Ascii from 'ascii-table';
import { client } from '../..';
import { events } from '../../events';

class eventHandler {
    static async run() {
        const eventsTable = new Ascii('Events').setHeading('Name', 'Status', 'Reason');

        for (const event of events) {
            let name;

            if (!event.name || !event.run) return eventsTable.addRow(`${event.name}`, 'Failed', 'Missing Name/Run');

            name = event.name;

            if (event.nick) name += ` (${event.nick})`;

            if (event.once) client.once(event.name, async (...args) => await event.run(...args, client));
            else client.on(event.name, async (...args) => await event.run(...args, client));

            eventsTable.addRow(name, 'Success');
        }
        
        console.log(eventsTable.toString());
    }
}

const handler = eventHandler;

export { handler };