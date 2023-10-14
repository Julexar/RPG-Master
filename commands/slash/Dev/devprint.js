import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "devprint";
        this.description = "Prints the Devlog";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
    };

    async run(client, interaction) {
        const user = interaction.user;
        if (!client.config.owners.includes(`${user.id}`)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Error 401: Unauthorized")
                        .setDescription("This Command can only be used by the Developer!")
                        .setTimestamp()
                ],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                files: [`./logs/dev/devlog.log`]
            });
            console.log(await client.database.resetDevLog().catch(console.error));
        }
    }
}
export default new Command();