import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "server";
        this.description = "Server specific Commands";
        this.defaultMemberPermissions = [PermissionFlagsBits.ManageGuild];
        this.enabled = true;
        this.options = [
            {
                name: "gm",
                description: "GM related Commands",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "add",
                        description: "Adds a GM",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "user",
                                description: "Provide a User",
                                type: ApplicationCommandOptionType.User,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "remove",
                        description: "Removes a GM",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "list",
                        description: "Shows a List of all GMs",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "can-edit",
                        description: "Sets whether GMs can edit Game assets",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "bool",
                                description: "Provide a Boolean",
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: "setrole",
                description: "Sets a Server Role",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "gm",
                        description: "Sets the GM Role",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Provide a Role",
                                type: ApplicationCommandOptionType.Role,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "mod",
                        description: "Sets the Mod Role",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Provide a Role",
                                type: ApplicationCommandOptionType.Role,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "admin",
                        description: "Sets the Admin Role",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Provide a Role",
                                type: ApplicationCommandOptionType.Role,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: "getrole",
                description: "Gets Server Roles",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "gm",
                        description: "Gets the GM Role",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "staff",
                        description: "Gets the Staff Roles",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "setchannel",
                description: "Sets serverwide Channels",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "summary",
                        description: "Sets Session Summary Channel",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "channel",
                                description: "Provide a Channel",
                                type: ApplicationCommandOptionType.Channel,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "log",
                        description: "Sets the Log Channel",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "channel",
                                description: "Provide a Channel",
                                type: ApplicationCommandOptionType.Channel,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: "dup-sessions",
                description: "Sets whether duplicate Sessions can be created",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "bool",
                        description: "Provide a Boolean",
                        type: ApplicationCommandOptionType.Boolean,
                        required: true,
                    },
                ],
            },
            {
                name: "print-logs",
                description: "Sets whether Logs should be posted Daily",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "bool",
                        description: "Provide a Boolean",
                        type: ApplicationCommandOptionType.Boolean,
                        required: true,
                    },
                ],
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();