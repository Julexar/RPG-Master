import { ApplicationCommandOptionType } from "discord.js";
class Command {
    constructor() {
        this.name = "help";
        this.description = "Displays Info about Commands";
        this.enabled = true;
        this.options = [
            {
                name: "command",
                description: "Select a Command",
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ];
    }

    async run(client, interaction) {

    }
}
export default new Command();