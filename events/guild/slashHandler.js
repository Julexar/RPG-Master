import { client } from '../..';
import { NotFoundError, ForbiddenError } from '../../custom/errors';
import { ErrorEmbed } from '../../custom/embeds';

class slashHandler {
    constructor() {
        this.name = 'interactionCreate';
        this.nick = 'Slash';
    }

    /**
     *
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        if (interaction.isChatInputCommand()) {
            const servCmd = client.database.Server.commands.getOne(server, { name: interaction.commandName });
            if (!servCmd.enabled) {
                return await interaction.reply({
                    embeds: [
                        new ErrorEmbed(
                            new ForbiddenError(
                                'Command disabled',
                                'This Command is disabled on this Server, please contact the Server Staff about this Issue.'
                            ),
                            false
                        ),
                    ],
                    ephemeral: true,
                });
            }

            const command = client.slashCommands.get(servCmd.name);

            if (!command) {
                return await interaction.reply({
                    embeds: [
                        new ErrorEmbed(
                            new NotFoundError(
                                'Command not found',
                                "This Command doesn't exit within the Bot's files, please contact the Developer about this Issue."
                            ),
                            false
                        ),
                    ],
                    ephemeral: true,
                });
            }

            if (command.permissions) {
                if (
                    command.permissions.bot &&
                    command.permissions.bot.length &&
                    !interaction.channel.permissionsFor(interaction.guild.me).has(command.permissions.bot)
                ) {
                    const perms = interaction.channel.permissionsFor(interaction.guild.me).missing(command.permissions.bot);

                    return await interaction.reply({
                        embeds: [
                            new ErrorEmbed(
                                new ForbiddenError(
                                    'Bot missing Permission',
                                    'The Bot is missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                ),
                                false
                            ),
                        ],
                        ephemeral: true,
                    });
                }
            }

            client.writeServerLog(interaction.guild, `/${command.name} was triggered by ${interaction.user.username}`);

            if (command.choices) command.setChoices(interaction.guild);

            await command.run(interaction);
        }
    }
}

export default new slashHandler();
