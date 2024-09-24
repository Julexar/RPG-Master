import { CommandInteraction, Guild, TextChannel } from 'discord.js';
import { client } from '../..';
import { NotFoundError, ForbiddenError } from '../../custom/errors';
import { ErrorEmbed } from '../../custom/embeds';

class slashHandler {
    name: string;
    nick: string;
    constructor() {
        this.name = 'interactionCreate';
        this.nick = 'Slash';
    }

    async run(interaction: CommandInteraction) {
        const server = interaction.guild as Guild;
        if (interaction.isChatInputCommand()) {
            const servCmd = await client.database.Server.commands.getOne(server, { name: interaction.commandName, type: 'slash' });
            
            if (!servCmd.enabled) {
                return await interaction.reply({
                    embeds: [
                        new ErrorEmbed(
                            new ForbiddenError(
                                'Command disabled',
                                'This Command is disabled on this Server, please contact the Server Staff about this Issue.'
                            ),
                            false
                        )
                    ],
                    ephemeral: true
                });
            }

            const command = client.slashCommands.get(servCmd.command.name);
            
            if (!command) {
                return await interaction.reply({
                    embeds: [
                        new ErrorEmbed(
                            new NotFoundError(
                                'Command not found',
                                'This Command doesn\'t exit within the Bot\'s files, please contact the Developer about this Issue.'
                            ),
                            false
                        )
                    ],
                    ephemeral: true
                });
            }

            const channel = interaction.channel as TextChannel;

            if (command.permissions) {
                if (command.permissions.bot &&
                    command.permissions.bot.length &&
                    !channel.permissionsFor(server.me).has(command.permissions.bot)
                ) {
                    const perms = channel.permissionsFor(server.me).missing(command.permissions.bot);

                    return await interaction.reply({
                        embeds: [
                            new ErrorEmbed(
                                new ForbiddenError(
                                    'Bot missing Permission',
                                    'The Bot is missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                ),
                                false
                            )
                        ],
                        ephemeral: true
                    });
                }
            }

            client.writeServerLog(server, `/${command.name} was triggered by ${interaction.user.username}`);

            if (command.choices) command.setChoices(server);

            await command.run(interaction);
        }
    }
}

export default new slashHandler();