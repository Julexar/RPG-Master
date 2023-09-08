import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "action";
        this.nick = "a";
        this.description = "Character Action Commands";
        this.enabled = false;
        this.defaultMemberPermissions = [PermissionFlagsBits.SendMessages];
        this.options = [
            {
                name: "execute",
                description: "Executes an Action",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "add",
                description: "Adds an Action",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "remove",
                description: "Removes an Action",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "edit",
                description: "Edits an Action",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();