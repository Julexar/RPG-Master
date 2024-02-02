import Ascii from 'ascii-table';
import { client } from '../..';
import { events } from '../../events';

class eventHandler {
    static async run() {
        const eventsTable = new Ascii('Events').setHeading('Name', 'Status', 'Reason');

        for (const event of events) {
            let name: string;

            if (!event.name || !event.run) return eventsTable.addRow(event.filename, 'Failed', 'Missing Name/Run');

            name = event.name;

            if (event.nick) name += ` (${event.nick})`;

            if (event.once) client.once(event.name, async (...args: any[]) => await event.run(...args));
            else client.on(event.name, async (...args: any[]) => await event.run(...args));

            eventsTable.addRow(name, 'Success');
        }

        console.log(eventsTable.toString());
    }
}

const handler = eventHandler;

export { handler };