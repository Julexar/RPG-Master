import { CommandBuilder } from "../../../custom/builders";
class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        await interaction.reply({
            content: 'Test Command Reply',
        });
    };
};

const command = new Command({
    name: 'test',
    description: 'Test Command'
});

export { command };