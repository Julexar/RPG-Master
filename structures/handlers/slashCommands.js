import Ascii from 'ascii-table';
import fs from 'fs';
import { client } from "../../index.js";
class slashHandler {
  constructor() {};
  async run() {
    const slashCommandsTable = new Ascii('Slash Commands').setHeading('Name', 'Status', 'Reason');
    const dirs = fs.readdirSync("./commands/slash");
    dirs.forEach(dir => {
      const files = fs.readdirSync(`./commands/slash/${dir}`);
      files.forEach(async (file) => {
        const module = await import(`../../commands/slash/${dir}/${file}`);
        const command = module.default;
        let name;
        if (!command.name || !command.run) {
          return slashCommandsTable.addRow(`${command.name || file}`, "Failed", "Missing Name/Run");
        }
        name = command.name;
        if (command.nick) {
          name += ` (${command.nick})`;
        }

        if (!command.enabled) {
          return slashCommandsTable.addRow(`${name}`, "Failed", "Disabled");
        }

        client.slashCommands.set(command.name, command);
        slashCommandsTable.addRow(name, "Success");
        if (file=="print.js") {
          console.log(slashCommandsTable.toString());
        }
      });
    });
  }
}
export default new slashHandler();