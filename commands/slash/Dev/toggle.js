import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { glob } from "glob";
import { promisify } from "util";
const promiseGlob = promisify(glob);
import fs from "fs";
class Command {
    constructor() {
        this.name = "toggle";
        this.description = "Toggles a Command";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
        this.options = [
            {
                name: "command",
                description: "Provide a Command",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();