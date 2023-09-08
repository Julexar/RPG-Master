import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { glob } from "glob";
import { promisify } from "util";
const promiseGlob = promisify(glob);
class Command {
    constructor() {
        this.name = "reload";
        this.description = "Reloads a Command";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
        this.options = [
            {
                name: "command",
                description: "Reloads a Command",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "name",
                        description: "Provide the Name of the Command",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
            {
                name: "all",
                description: "Reloads all Commands",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();