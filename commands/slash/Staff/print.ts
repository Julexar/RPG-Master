import { CommandInteraction, Guild, TextChannel } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { Server } from '../../../*';
import { BadRequestError, NotFoundError } from '../../../custom/errors';
import { ErrorEmbed } from '../../../custom/embeds';

class Command extends CommandBuilder {
    enabled: boolean;
    constructor(data: any) {
        super(data);

        this.enabled = true;
    }

    async run(interaction: CommandInteraction) {
        const guild = interaction.guild as Guild;
        try {
            const server = await client.database.Server.getOne(guild) as Server;
            const log = await client.database.Server.logs.getLatest(guild);

            if (server.log_channelid) {
                const channel = guild.channels.cache.get(String(server.log_channelid)) as TextChannel;
                if (channel) {
                    await channel.send({
                        files: [`./logs/server/${server.id}/${log.created_at}.log`],
                    });

                    return interaction.reply({
                        content: `The Log has been sent to <#${channel.id}>`,
                        ephemeral: true,
                    });
                } else throw new BadRequestError('Invalid Log Channel', 'That Log Channel does not exist on the Server!');
            }
        } catch (err) {
            client.writeServerLog(guild, err);

            if (err instanceof NotFoundError) {
                return interaction.reply({
                    embeds: [new ErrorEmbed(err, false)],
                    ephemeral: true,
                });
            } else {
                return interaction.reply({
                    embeds: [new ErrorEmbed(err, true)],
                    ephemeral: true,
                });
            }
        }
    }
}

const command = new Command({
    name: 'print',
    description: 'Prints the Log',
});

export { command };