import { ApplicationCommandOptionType} from "discord.js";
class Command {
    constructor() {
        this.name = "settings";
        this.description = "Personal settings";
        this.enabled = true;
        this.options = [
            {
                name: "toggle",
                description: "Toggles settings",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "suggestions",
                        description: "Toggles whether you can receive suggestions",
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