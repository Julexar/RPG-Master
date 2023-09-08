import { ApplicationCommandOptionType } from "discord.js";
class Command {
    constructor() {
        this.name = "character";
        this.description = "Character related Commands";
        this.enabled = true;
        this.options = [
            {
                name: "select",
                description: "Selects a Character",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "view",
                description: "Posts Info about your Characters",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "add",
                description: "Adds a new Character",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "remove",
                description: "Removes a Character",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "edit",
                description: "Edits a Character",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "notes",
                description: "Character Note Commands",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "view",
                        description: "Pulls up your Character Notes",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "private",
                                description: "Toggle viewing private Notes",
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "add",
                        description: "Adds a Character Note",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "remove",
                        description: "Removes a Character Note",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "edit",
                        description: "Edits a Character Note",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
        ];
    }

    async run(client, interaction) {

    }
}
export default new Command();