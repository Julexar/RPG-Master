import { CommandBuilder } from "../../../custom/builders";
import { client } from "../../..";
import { NotFoundError } from "../../../custom/errors";
import { ErrorEmbed } from "../../../custom/embeds";

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }
    
    /**
     * 
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        const guild = interaction.guild;
        try {
            const server = await client.database.Server.getOne(guild)
            const log = await client.database.Server.logs.getLatest(server)

            if (server.log_chan) {
                const channel = guild.channels.cache.get(server.log_chan);
                if (channel) {
                    await channel.send({
                        files: [`./logs/server/${server.id}/${log.created_at}.log`]
                    })

                    return interaction.reply({
                        content: `The Log has been sent to <#${channel.id}>`,
                        ephemeral: true
                    });
                }
            }
        } catch (err) {
            client.writeServerLog(guild, err);

            if (err instanceof NotFoundError) {
                return interaction.reply({ 
                    embeds: [
                        new ErrorEmbed(err, false)
                    ],
                    ephemeral: true
                });
            } else {
                return interaction.reply({
                    embeds: [
                        new ErrorEmbed(err, true)
                    ],
                    ephemeral: true
                });
            }
        }
    }
}

const command = new Command({
    name: 'print',
    description: 'Prints the Log'
})

export { command };