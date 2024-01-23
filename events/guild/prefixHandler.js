import { EmbedBuilder } from 'discord.js';
import { client } from '../../index.js';
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
        client.database
            .getPrefix(message.guild)
            .then((prefixes) => {
                if (prefixes) {
                    prefixes = JSON.parse(JSON.stringify(prefixes));
                    let c_prefix;
                    prefixes.forEach((prefix) => {
                        if (message.content.toLowerCase().startsWith(prefix)) {
                            c_prefix = prefix;
                            let args = message.content.slice(c_prefix.length).trim().split(/\s+--/);
                            const command = args.shift().toLowerCase();
                            const cmd =
                                client.prefixCommands.get(command) || client.prefixCommands.find((c) => c.aliases && c.aliases.includes(command));
                            if (!cmd) {
                                return;
                            }
                            if (cmd.permissions) {
                                if (cmd.permissions.member && cmd.permissions.member.length >= 1) {
                                    if (!message.channel.permissionsFor(message.member).has(cmd.permissions.member)) {
                                        let perms = message.channel.permissionsFor(message.member).missing(cmd.permissions.member);
                                        return message.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Red')
                                                    .setTitle('Error 403: Missing Permission')
                                                    .setDescription(
                                                        'You are missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                                    )
                                                    .setTimestamp(),
                                            ],
                                        });
                                    }
                                } else if (cmd.permissions.bot && cmd.permissions.bot.length >= 1) {
                                    if (!message.channel.permissionsFor(message.guild.me).has(cmd.permissions.bot)) {
                                        let perms = message.channel.permissionsFor(message.guild.me).missing(cmd.permissions.bot);
                                        return message.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Red')
                                                    .setTitle('Error 403: Bot missing Permission')
                                                    .setDescription(
                                                        'The Bot is missing the needed Permissions to run the current Command:\n' + perms.join(', ')
                                                    )
                                                    .setTimestamp(),
                                            ],
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
                                        return message.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Red')
                                                    .setTitle('Error 400: Invalid Command')
                                                    .setDescription(
                                                        `The Command requires you to use it\'s arguments. The correct usage is:\n\`${prefix}${cmd.name} ${usage}\``
                                                    ),
                                            ],
                                        });
                                    } else {
                                        client.database
                                            .writeLog(
                                                message.guild,
                                                `${prefix}${cmd.name} was triggered by ${message.author.username}\nArguments: ${args.join(', ')}`
                                            )
                                            .then(cmd.run(client, message, args))
                                            .catch((err) => {
                                                console.error(err);
                                                cmd.run(client, message, args);
                                            });
                                        message.delete();
                                    }
                                } else {
                                    client.database
                                        .writeLog(
                                            message.guild,
                                            `${prefix}${cmd.name} was triggered by ${message.author.username}\nArguments: ${args.join(', ')}`
                                        )
                                        .then(cmd.run(client, message, args))
                                        .catch((err) => {
                                            console.error(err);
                                            cmd.run(client, message, args);
                                        });
                                    message.delete();
                                }
                            } else if (!cmd.args) {
                                if (args.length > 0) {
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Red')
                                                .setTitle('Error 400: Invalid Command')
                                                .setDescription(
                                                    `This Command does not have any arguments. The correct usage is:\n\`${prefix}${cmd.name}\``
                                                )
                                                .setTimestamp(),
                                        ],
                                    });
                                } else {
                                    client.database
                                        .writeLog(
                                            message.guild,
                                            `${prefix}${cmd.name} was triggered by ${message.author.username}\nArguments: ${args.join(', ')}`
                                        )
                                        .then(cmd.run(client, message, args))
                                        .catch((err) => {
                                            console.error(err);
                                            cmd.run(client, message, args);
                                        });
                                    message.delete();
                                }
                            }
                        }
                    });
                } else if (!prefixes) {
                    client.database
                        .writeLog(message.guild, 'Error 404: No Prefixes found')
                        .then(
                            message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Red')
                                        .setTitle('Error 404: No Prefixes found')
                                        .setDescription('Could not find any Prefixes on this Server. Contact a Server Admin to fix this Issue.')
                                        .setTimestamp(),
                                ],
                            })
                        )
                        .catch(console.error);
                }
            })
            .catch((err) => {
                client.database
                    .writeLog(message.guild, `${err}`)
                    .then(
                        message.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                        })
                    )
                    .catch(console.error);
            });
    }
}
export default new prefixHandler();
