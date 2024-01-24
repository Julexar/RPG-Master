import { client } from '../..';
import { ErrorEmbed } from '../../custom/embeds';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../custom/errors';

class prefixHandler {
    constructor() {
        this.name = 'messageCreate';
        this.nick = 'Prefix';
    }

    /**
     *
     * @param {import("discord.js").Message} message
     */
    async run(message) {
        const server = message.guild;
        try {
            const prefixes = await client.database.Server.prefixes.getAll(server)

            for (const prefix of prefixes) {
                if (message.content.toLowerCase().startsWith(prefix)) {
                    const args = message.content.slice(prefix.length).trim().split(/\s+--/);
                    const command = args.shift().toLowerCase();

                    const cmd = client.prefixCommands.get(command) || client.prefixCommands.find((c) => c.aliases && c.aliases.includes(command));

                    if (!cmd) return;

                    if (cmd.permissions) {
                        if (cmd.permissions.member && cmd.permissions.member.length >= 1) {
                            if (!message.channel.permissionsFor(message.member).has(cmd.permissions.member)) {
                                const perms = message.channel.permissionsFor(message.member).missing(cmd.permissions.member);
                                
                                return await message.reply({
                                    embeds: [
                                        new ErrorEmbed(
                                            new ForbiddenError(
                                                'Missing Permission',
                                                'You are missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                            ),
                                            false
                                        )
                                    ],
                                    ephemeral: true
                                });
                            }
                        } else if (cmd.permissions.bot && cmd.permissions.bot.length >= 1) {
                            if (!message.channel.permissionsFor(message.guild.me).has(cmd.permissions.bot)) {
                                const perms = message.channel.permissionsFor(message.guild.me).missing(cmd.permissions.bot);
                                
                                return await message.reply({
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
                    }

                    if (cmd.args) {
                        if (!cmd.optional) {
                            if (args.length < cmd.usage.length) {
                                let usage = '';
                                for (const arg of cmd.usage) {
                                    usage += arg + ' ';
                                }
                                return await message.reply({
                                    embeds: [
                                        new ErrorEmbed(
                                            new BadRequestError(
                                                'Invalid Command',
                                                `The Command requires you to use it\'s arguments. The correct usage is:\n\`${prefix}${cmd.name} ${usage}\``
                                            ),
                                            false
                                        )
                                    ],
                                    ephemeral: true
                                });
                            } else {
                                client.writeServerLog(server, `${prefix}${cmd.name} was triggered by ${message.author.username}\nArguments: ${args.join(', ')}`);
                                
                                await cmd.run(client, message, args);
                                await message.delete();
                            }
                        } else {
                            client.writeServerLog(server,`${prefix}${cmd.name} was triggered by ${message.author.username}\nArguments: ${args.join(', ')}`);
                            
                            await cmd.run(client, message, args);
                            await message.delete();
                        }
                    } else if (!cmd.args) {
                        if (args.length > 0) {
                            return await message.reply({
                                embeds: [
                                    new ErrorEmbed(
                                        new BadRequestError(
                                            'Invalid Command',
                                            `This Command does not have any arguments. The correct usage is:\n\`${prefix}${cmd.name}\``
                                        ),
                                        false
                                    )
                                ],
                                ephemeral: true
                            });
                        } else {
                            client.writeServerLog(server, `${prefix}${cmd.name} was triggered by ${message.author.username}\nArguments: ${args.join(', ')}`);
                            
                            await cmd.run(client, message, args);
                            await message.delete();
                        }
                    }
                }
            }
        } catch (err) {
            if (err instanceof NotFoundError) return await message.reply({
                embeds: [new ErrorEmbed(err, false)],
                ephemeral: true
            });

            return await message.reply({
                embeds: [new ErrorEmbed(err, true)],
                ephemeral: true
            })
        }
    }
}

export default new prefixHandler();