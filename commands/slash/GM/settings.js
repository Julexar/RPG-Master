import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
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
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        client.database.getGM(server, user)
            .then(() => {
                switch (option.getSubcommandGroup()) {
                    case "toggle":
                        switch (option.getSubcommand()) {
                            case "suggestions":
                                client.database.togGMSug(server, user)
                                    .then(async (msg) => {
                                        client.database.writeLog(server, `${msg}`)
                                            .then(mes => client.database.writeDevLog(`${mes}`))
                                            .catch(err => client.database.writeDevLog(`${err}`));
                                        await interaction.reply({
                                            content: msg,
                                            ephemeral: true
                                        });
                                    })
                                    .catch(async (err) => {
                                        client.database.writeLog(server, `${err}`)
                                            .then(msg => client.database.writeDevLog(`${msg}`))
                                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                                        if (String(err).includes("Error 404: GM")) {
                                            await interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor("Red")
                                                        .setTitle(`${err}`)
                                                        .setDescription("Could not find a GM entry in the Database! Please contact a Staff member")
                                                        .setTimestamp()
                                                ],
                                                ephemeral: true
                                            });
                                        } else {
                                            await interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor("Red")
                                                        .setTitle("An Error occurred...")
                                                        .setDescription(`${err}`)
                                                        .setTimestamp()
                                                ],
                                                ephemeral: true
                                            });
                                        }
                                    });
                            return;
                        }
                    return;
                }
            })
            .catch(async (err) => {
                client.database.writeLog(server, `${err}`)
                    .then(msg => client.database.writeDevLog(`${msg}`))
                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                if (String(err).includes("Error 404")) {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setTitle(`${err}`)
                                .setDescription("Could not find a GM entry in the Database! Please contact a Staff member")
                                .setTimestamp()
                        ],
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("An Error occurred...")
                                .setDescription(`${err}`)
                                .setTimestamp()
                        ],
                        ephemeral: true
                    });
                }
            });
    }
}
export default new Command();