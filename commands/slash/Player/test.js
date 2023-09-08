class Command {
    constructor() {
        this.name = "test";
        this.description = "Test Command";
        this.enabled = true;
    };

    async run(client, interaction) {
        await interaction.reply({
            content: "Test Command Reply"
        });
    };
};
export default new Command();