import Ascii from 'ascii-table';
import fs from 'fs/promises';
import { client } from "../../index.js";
class contextHandler {
  constructor() {};

  async run() {
    const contextCommandsTable = new Ascii('Context Commands').setHeading('Name', 'Status', 'Reason');
    fs.readdir("./commands/context")
      .then(dirs => {
        dirs.forEach(dir => {
          const files = fs.readdir(`./commands/context/${dir}`);
          files.forEach(async (file) => {
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
    
            client.contextCommands.set(contextCommandsTable);
            console.log(contextCommandsTable.toString());
          });
        });
      })
      .catch(err => {
        let idc = err;
      });
  }
}
export default new contextHandler();