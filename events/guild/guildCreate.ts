import { ApplicationCommand, ApplicationCommandPermissions, Collection, Guild, GuildMember, GuildTextBasedChannel, Snowflake } from 'discord.js';
import { client } from '../..';
import { DuplicateError, NotFoundError } from '../../custom/errors';
import { ErrorEmbed } from '../../custom/embeds';

class Event {
    name: string;
    constructor() {
        this.name = 'guildCreate';
    }

    async run(guild: Guild) {
        //Server Registration
        this.registerServer(guild);

        //Member Registration
        await this.registerMembers(guild);

        //Interval Creation
        await this.createInterval(guild);

        //Command Registration
        await this.registerServerCommands(guild);
    }

    registerServer(guild: Guild) {
        client.writeDevLog(`Attempting to register Server \"${guild.name}\"...`)
        const server = {
            id: BigInt(guild.id),
            name: guild.name
        };

        client.database.Server.add(server)
        .then(client.writeDevLog)
        .catch(client.logDevError);
        
        client.database.Server.logs.add(guild)
        .then(async msg => await client.writeServerLog(guild, msg))
        .catch(async err => await client.logServerError(guild, err));
    }

    async registerMembers(guild: Guild) {
        await client.writeServerLog(guild, 'Beginning Member registration - Searching Database for Members...')

        client.database.Server.members.getAll(guild)
        .then (async (members) => {
            await client.writeServerLog(guild, `Found ${members.length} members in Database, checking if they exist on the Server...`)
        
            for (const member of members) {
                if (!guild.members.cache.has(String(member.id))) {
                    client.writeServerLog(guild, `Could not find \"${member.displayName}\" in the Server - Removing from Database...`)

                    const msg = await client.database.Server.members.remove(guild, member)

                    await client.writeServerLog(guild, msg)
                } else {
                    await client.writeServerLog(guild, `Found Member \"${member.displayName}\" in Server - Skipping...`)
                    continue;
                }
            }
        })
        .catch(async (err) => await client.logServerError(guild, err));

        guild.members.cache.forEach(async (member: GuildMember) => {
            if (!member.user.bot) {
                client.database.Server.members.add(guild, member)
                .then(async msg => await client.writeServerLog(guild, msg))
                .catch(async err => {
                    if (!(err instanceof DuplicateError)) await client.logServerError(guild, err)
                });
            }
        });
    }

    async createInterval(guild: Guild) {
        await client.writeServerLog(guild, 'Member registration complete - Creating Interval for Logging...')

        setInterval(async () => {
            try {
                const dbServer = await client.database.Server.getOne(guild)

                if (dbServer.print_logs) {
                    if (dbServer.log_channelid) {
                        const channel = guild.channels.cache.get(String(dbServer.log_channelid)) as GuildTextBasedChannel;

                        await client.writeServerLog(guild, 'Printing Logfile...')

                        try {
                            const logfile = await client.database.Server.logs.getLatest(guild);
    
                            await channel.send({
                                files: [`./logs/server/${guild.id}/${logfile.created_at}.log`]
                            });
                        } catch (err) {
                            await client.logServerError(guild, err);
    
                            await channel.send({
                                embeds: [new ErrorEmbed(err, false)]
                            });
                        }
                    } else throw new NotFoundError('No Logchannel found', `This Server has no Logchannel defined, please set one with \`/server setchannel log\``)
                }
            } catch (err) {
                await client.logServerError(guild, err)
            }
        }, 1000 * 60 * 60 * 24);
    }

    async registerServerCommands(guild: Guild) {
        await client.writeServerLog(guild, 'Interval created - Attempting to register Server Commands...')

        guild.commands.set(Array.from(client.slashCommands.values()))
        .then(async (commands: Collection<Snowflake, ApplicationCommand>) => {
            await client.writeServerLog(guild, `Successfully registered ${commands.size} Commands in Server - Attempting to write Server Commands to Database...`)

            commands.forEach(async (command) => {
                client.writeServerLog(guild, `Attempting to write Command /${command.name} to Database...`)

                try {
                    const cmd = await client.database.Command.getOne({name: command.name}, 'slash');
                    
                    await client.database.Server.commands.add(guild, {
                        id: BigInt(command.id),
                        command_id: BigInt(cmd.id),
                        name: command.name,
                        type: 'slash'
                    });

                    await client.writeServerLog(guild, `Successfully wrote Command /${command.name} to Database`);
                } catch (err) {
                    await client.logServerError(guild, err);
                }

                try {
                    await client.writeServerLog(guild, `Searching Database for Restrictions for Command /${command.name}`)
                    
                    const restrictions = await client.database.Server.commands.restrictions.getAll({ id: BigInt(command.id) }) as unknown as readonly ApplicationCommandPermissions[]
                    await client.writeServerLog(guild, `Found ${restrictions.length} Restrictions for Command /${command.name} - Attempting to add them to the Command...`)

                    await guild.commands.permissions.add({
                        command: command.id,
                        token: client.config.token,
                        permissions: restrictions
                    });

                    await client.writeServerLog(guild, `Successfully added restrictions to Command /${command.name}`)
                } catch (err) {
                    await client.logServerError(guild, err)
                }
            });
        })
        .catch(async err => await client.logServerError(guild, err));

        await client.writeServerLog(guild, 'Finished registering Server Commands - Bot is now ready!');
    }
}

export default new Event();