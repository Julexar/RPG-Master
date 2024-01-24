import { client } from '../..';
import { NotFoundError } from '../../custom/errors';

class Event {
    constructor() {
        this.name = 'guildCreate';
    }

    /**
     *
     * @param {import("discord.js").Guild} guild
     */
    async run(guild) {
        const commandArray = client.slashCommands;
        const server = {
            id: guild.id,
            name: guild.name,
            dm_role: null,
            admin_role: null,
            mod_role: null,
            prefix: client.config.default_prefix,
        };

        client.database.Server.add(server)
        .then(client.writeDevLog)
        .catch(client.logDevError)
        
        client.database.Server.logs.add(server)
        .then(msg => client.writeServerLog(server, msg))
        .catch(err => client.logServerError(server, err))

        client.writeServerLog(server, 'Beginning Member registration - Searching Database for Members...')

        client.database.Server.members.getAll(server)
        .then (async (members) => {
            client.writeServerLog(server, `Found ${members.length} members in Database, checking if they exist on the Server...`)
        
            for (const member of members) {
                if (!guild.members.cache.has(member.id)) {
                    client.writeServerLog(server, `Could not find \"${member.display_name}\" in the Server - Removing from Database...`)

                    let msg = await client.database.Server.members.remove(server, member)

                    client.writeServerLog(server, msg)
                } else {
                    client.writeServerLog(server, `Found Member \"${member.display_name}\" in Server - Skipping...`)
                    continue;
                }
            }
        })
        .catch(async (err) => {
            client.logServerError(server, err)

            guild.members.cache.forEach(async (member) => {
                if (!member.user.bot) {
                    client.database.Server.members.add(server, member)
                    .then(msg => client.writeServerLog(server, msg))
                    .catch(err => client.logServerError(server, err))
                }
            })
        });

        client.writeServerLog(server, 'Member registration complete - Creating Interval for Logging...')

        setInterval(async () => {
            try {
                const dbServer = await client.database.Server.getOne(server)

                if (dbServer.print_logs) {
                    if (dbServer.log_channelId) {
                        const channel = guild.channels.cache.get(dbServer.log_channelId)

                        client.writeServerLog(server, 'Logging Interval triggered, logging enabled - Printing Logfile...')

                        const logfile = await client.database.Server.logs.getLatest(server)

                        await channel.send({
                            files: [`./logs/${server.id}/${logfile.created_at}.log`]
                        });
                    } else throw new NotFoundError('No Logchannel found', `This Server has no Logchannel defined, please set one with \`/server setchannel log\``)
                }
            } catch (err) {
                client.logServerError(server, err)
            }
        }, 1000 * 60 * 60 * 24);

        client.writeServerLog(server, 'Interval created - Attempting to register Server Commands...')

        await guild.commands.set(commandArray)
        .then(commands => {
            client.writeServerLog(server, `Successfully registered ${commands.size} Commands in Server - Attempting to write Server Commands to Database...`)

            commands.forEach(async (command) => {
                client.writeServerLog(server, `Attempting to write Command /${command.name} to Database...`)

                try {
                    const cmd = client.database.Command.getOne({name: command.name}, 1)
                    
                    await client.database.Server.commands.add(server, {
                        id: command.id,
                        command_id: cmd.id,
                        name: command.name,
                        type: 1
                    });

                    client.writeServerLog(server, `Successfully wrote Command /${command.name} to Database`)
                } catch (err) {
                    client.logServerError(server, err)
                }

                try {
                    client.writeServerLog(server, `Searching Database for Restrictions for Command /${command.name}...`)
                    
                    const restrictions = await client.database.Server.commands.restrictions.getAll(command)
                    client.writeServerLog(server, `Found ${restrictions.length} Restrictions for Command /${command.name} - Attempting to add them to the Command...`)

                    await guild.commands.permissions.add({
                        command: command.id,
                        token: client.config.token,
                        permissions: restrictions
                    });

                    client.writeServerLog(server, `Successfully added restrictions to Command /${command.name}`)
                } catch (err) {
                    client.logServerError(server, err)
                }
            });
        })
        .catch(err => client.logServerError(server, err))

        client.writeServerLog(server, 'Finished registering Server Commands - Bot is now ready!')
    }
}

export default new Event();