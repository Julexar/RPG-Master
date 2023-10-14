import Ascii from 'ascii-table';
import fs from 'fs/promises';
import { client } from "../../index.js";
class contextHandler {
  constructor() {};

  async run() {
    const contextCommandsTable = new Ascii('Context Commands').setHeading('Name', 'Status', 'Reason');
    const dirs = fs.readdirSync("./commands/context");

    for (const dir of dirs) {

      const files = fs.readdirSync(`./commands/context/${dir}`);

      for (const file of files) {

        const module = await import(`../../commands/context/${dir}/${file}`);
        const command = module.default;
        let name;

        if (!command.name || !command.run) {
          return contextCommandsTable.addRow(`${command.name || file}`, "Failed", "Missing Name/Run");
        }

        name = command.name;

        if (command.nick) {
          name += ` (${command.nick})`;
        }

        contextCommandsTable.addRow(name, "Success");
        
      }

    }

    console.log(contextCommandsTable.toString());
  }
}
export default new contextHandler();