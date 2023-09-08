import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "game";
        this.nick = "g";
        this.description = "Game related Commands";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.MuteMembers];
        this.options = [
            {
                name: "add",
                description: "Adds a Game Asset",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "armor",
                        description: "Adds a custom Armor",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "class",
                        description: "Adds a custom Class",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "condition",
                        description: "Adds a custom Condition",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "dmgtype",
                        description: "Adds a custom Damagetype",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "feat",
                        description: "Adds a custom Feat",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "race",
                        description: "Adds a custom Race",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subclass",
                        description: "Adds a custom Subclass",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subrace",
                        description: "Adds a custom Subrace",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "remove",
                description: "Removes a Game Asset",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "armor",
                        description: "Removes a custom Armor",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "class",
                        description: "Removes a custom Class",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "condition",
                        description: "Removes a custom Condition",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "dmgtype",
                        description: "Removes a custom Damagetype",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "feat",
                        description: "Removes a custom Feat",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "race",
                        description: "Removes a custom Race",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subclass",
                        description: "Removes a custom Subclass",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subrace",
                        description: "Removes a custom Subrace",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "edit",
                description: "Edits an existing Game Asset",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "armor",
                        description: "Edits a custom Armor",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "class",
                        description: "Edits a custom Class",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "condition",
                        description: "Edits a custom Condition",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "dmgtype",
                        description: "Edits a custom Damagetype",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "feat",
                        description: "Edits a custom Feat",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "race",
                        description: "Edits a custom Race",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subclass",
                        description: "Edits a custom Subclass",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subrace",
                        description: "Edits a custom Subrace",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();