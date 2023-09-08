import Ascii from 'ascii-table';
import fs from 'fs';
import { client } from "../../index.js";

class eventHandler {
  constructor() {};

  async run() {
    const eventsTable = new Ascii('Events').setHeading('Name', 'Status', 'Reason');
    const dirs = fs.readdirSync("./events");
    dirs.forEach(dir => {
      const files = fs.readdirSync(`./events/${dir}`);
      files.forEach(async (file) => {
        const module = await import(`../../events/${dir}/${file}`);
        const event = module.default;
        let name;
        if (!event.name || !event.run) {
          return eventsTable.addRow(`${event.name || file}`, "Failed", "Missing Name/Run");
        }

        name = event.name;
        if (event.nick) {
          name += ` (${event.nick})`;
        }

        if (event.once) {
          client.once(event.name, (...args) => event.run(...args, client));
        } else {
          client.on(event.name, (...args) => event.run(...args, client));
        }
        eventsTable.addRow(name, "Success");
        if (file=="slashHandler.js") {
          console.log(eventsTable.toString());
        }
      });
    });
  }
}
export default new eventHandler();