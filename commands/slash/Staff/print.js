import { EmbedBuilder } from "discord.js";
class Command {
    constructor() {
        this.name = "print";
        this.description = "Prints Logs";
        this.enabled = true;
    };
    async run(client, interaction) {
        const server = interaction.guild;
        client.database.getLog(server)
            .then(async (log) => {
                client.database.getServer(server)
                    .then(async (serv) => {
                        if (serv.log_chan) {
                            const chan = server.channels.cache.get(serv.log_chan);
                            await chan.send({
                                files: [`./logs/server/${server.id}/${log.id}.log`]
                            });
                        await interaction.reply({
                            content: `Logfile has been sent to <#${chan.id}>`
                        })
                        } else {
                            await interaction.reply({
                                content: "No Log Channel defined!",
                                files: [`./logs/server/${server.id}/${log.id}.log`]
                            });
                        }
                    })
                    .catch(async (err) => {
                        if (String(err).includes("Error 404")) {
                            await interaction.reply({
                                embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`${err}`)
                                    .setDescription("Could not find the Server in the Database! Contact the Developer if this Issue persists.")
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
            })
            .catch(err => {
                client.database.writeLog(server, `${err}`)
                    .then(console.log)
                    .catch(console.error);
            });
    }
};
export default new Command();