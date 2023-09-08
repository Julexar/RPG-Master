import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "session";
        this.description = "Session specific Commands";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.MoveMembers];
        this.options = [
            {
                name: "select",
                description: "Selects a created Session",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "create",
                description: "Creates a new Session",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "channel",
                        description: "Provide a Channel for your Session",
                        type: ApplicationCommandOptionType.Channel,
                        required: true,
                    },
                ],
            },
            {
                name: "delete",
                description: "Deletes a Session",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "poll",
                description: "Creates a Poll for your Session",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "channel",
                        description: "Select a Channel for the Poll",
                        type: ApplicationCommandOptionType.Channel,
                        required: true,
                    },
                ],
            },
            {
                name: "post",
                description: "Posts Session Application in a Channel",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "requirement",
                        description: "Provide a custom requirement for Players to post",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: "begin",
                description: "Starts the Session timer",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "end",
                description: "Ends the Session timer",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    };

    async run(client, interaction) {

    }
}
export default new Command();