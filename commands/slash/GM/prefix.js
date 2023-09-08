import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "prefix";
        this.description = "Prefix Command";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
        this.options = [
            {
                name: "add",
                description: "Adds a Prefix",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "prefix",
                        description: "Provide a Prefix",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
            {
                name: "remove",
                description: "Removes a Prefix",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "list",
                description: "Shows a List of all Prefixes",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();