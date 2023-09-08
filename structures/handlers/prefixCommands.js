import Ascii from 'ascii-table';
import fs from 'fs';
import { client } from "../../index.js";
class prefixHandler {
  constructor() {};

  async run() {
    const prefixCommandsTable = new Ascii('Prefix Commands').setHeading('Name', 'Status', 'Reason');
    const dirs = fs.readdirSync("./commands/prefix");
    dirs.forEach(dir => {
      const files = fs.readdirSync(`./commands/prefix/${dir}`);
      files.forEach(async (file) => {
        const module = await import(`../../commands/prefix/${dir}/${file}`);
        const command = module.default;
        let name;
        if (!command.name || !command.run) {
          return prefixCommandsTable.addRow(`${command.name || file}`, "Failed", "Missing Name/Run");
        }
        name = command.name;
        if (command.nick) {
          name += ` (${command.nick})`;
        }
        client.prefixCommands.set(command.name, command);
        prefixCommandsTable.addRow(name, "Success");
        if (file=="br.js") {
          console.log(prefixCommandsTable.toString());
        }
      });
    });
  }
}
export default new prefixHandler();