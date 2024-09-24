import { Message, TextChannel } from 'discord.js';
import { client } from '../..';
import { ErrorEmbed } from '../../custom/embeds';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../custom/errors';

class prefixHandler {
    name: string;
    nick: string;
    constructor() {
        this.name = 'messageCreate';
        this.nick = 'Prefix';
    }

    async run(message: Message) {
        const server = message.guild;

        if (!server) throw new BadRequestError('Invalid Server', 'Could not fetch the Server based on the Message!')

        try {
            const prefixes = await client.database.Server.prefixes.getAll(server) as string[]

            for (const prefix of prefixes) {
                if (message.content.toLowerCase().startsWith(prefix)) {
                    const args = message.content.slice(prefix.length).trim().split(/\s+--/) as string[];
                    const arg = args.shift() as string;
                    const command = arg.toLowerCase();

                    const cmd = client.prefixCommands.get(command) || client.prefixCommands.find((c) => c.aliases && c.aliases.includes(command));

                    if (!cmd) return;

                    const channel = message.channel as TextChannel

                    if (cmd.permissions) {
                        if (cmd.permissions.member && cmd.permissions.member.length >= 1) {
                            if (message.member && !channel.permissionsFor(message.member).has(cmd.permissions.member)) {
                                const perms = channel.permissionsFor(message.member).missing(cmd.permissions.member);
                                
                                return await message.reply({
                                    embeds: [
                                        new ErrorEmbed(
                                            new ForbiddenError(
                                                'Missing Permission',
                                                'You are missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                            ),
                                            false
                                        )
                                    ]
                                });
                            }
                        } else if (cmd.permissions.bot && cmd.permissions.bot.length >= 1) {
                            if (!channel.permissionsFor(server.me).has(cmd.permissions.bot)) {
                                const perms = channel.permissionsFor(server.me).missing(cmd.permissions.bot);
                                
                                return await message.reply({
                                    embeds: [
                                        new ErrorEmbed(
                                            new ForbiddenError(
                                                'Bot missing Permission',
                                                'The Bot is missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                            ),
                                            false
                                        )
                                    ]
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
                                    ]
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
                                ]
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
                embeds: [new ErrorEmbed(err, false)]
            });

            return await message.reply({
                embeds: [new ErrorEmbed(err, true)]
            });
        }
    }
}

export default new prefixHandler();