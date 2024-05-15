import { ApplicationCommand, ApplicationCommandDataResolvable, ApplicationCommandPermissions, Collection, Guild, PresenceData, Snowflake, TextChannel } from 'discord.js';
import { loggers, format, transports } from 'winston';
import moment from 'moment';
import { client } from '../..';
import { DuplicateError, NotFoundError } from '../../custom/errors';
import { ErrorEmbed } from '../../custom/embeds';

class Event {
    public readonly name = 'ready';

    static async run() {
        //Database Command Registration
        await this.registerDBCommands();

        client.user?.setPresence(client.config.presence as PresenceData);

        //Database Servers Check
        await this.checkDBServers();

        //Servercache Check
        await this.checkServerCache();
    }

    static async registerDBCommands() {
        client.slashCommands.forEach(async (cmd) => {
            client.writeDevLog(`Attemtping to register Command /${cmd.name} in Database...`);

            try {
                const command = await client.database.Command.getOne(cmd, 'slash')
                client.writeDevLog(`The Command /${command.name} already exists within the Database!\nChecking if there have been changes...`);
                
                if (command.enabled !== cmd.enabled) {
                    client.writeDevLog('Found changes, attempting to apply changes in Database...');
                    client.database.Command.update(cmd, 'slash')
                    .then(client.writeDevLog)
                    .catch(client.writeDevLog);
                } else {
                    client.writeDevLog('No changes found, skipping to next Command');
                }
            } catch (err) {
                client.logDevError(err);

                if (err instanceof NotFoundError) {
                    client.database.Command.add(cmd, 'slash')
                    .then(client.writeDevLog)
                    .catch(client.logDevError);
                }
            }
        });
    }

    static async checkDBServers() {
        client.writeDevLog('Checking existing Servers...');
        const servers = await client.database.Server.getAll()

        for (const server of servers) {
            const guild = client.guilds.cache.get(String(server.id)) as Guild;
            client.writeDevLog(`Found Server \"${server.name}\" in Database, checking if it still exists...`);

            if (!client.guilds.cache.has(String(server.id))) {
                client.writeDevLog(`Removing Server \"${server.name}\" from Database because it no longer exists...`);

                client.database.Server.remove(server)
                .then(client.writeDevLog)
                .catch(client.logDevError);
            } else {
                const err1 = new DuplicateError('Duplicate Server', 'This Server already exists in the Database!');
                client.logDevError(err1);

                client.writeDevLog(`Attempting to create new Logfile for Server \"${server.name}\"`);

                //Logfile Creation
                await this.checkServerLogger(guild);

                //Member Registration
                await this.registerMembers(guild);

                //Interval Creation
                this.createInterval(guild);

                //Command Registration
                await this.registerServerCommands(guild);
            }
        }
    }

    static async checkServerLogger(server: Guild) {
        const log = await client.database.Server.logs.getLatest(server);
        const date = new Date().toISOString();
        const difference = moment(log.created_at).diff(moment(date), 'hours')

        if (loggers.get(server.id) && difference >= 23) loggers.close(server.id);

        loggers.add(server.id, {
            format: format.combine(
                format.timestamp(),
                format.printf(info => `${info.message}`)
            ),
            transports: [new transports.File({ filename: `./logs/server/${server.id}/${date}.log` })]
        });

        client.database.Server.logs.add(server, date)
        .then(async msg => await client.writeServerLog(server, msg))
        .catch(async err => await client.logServerError(server, err));
    }

    static async checkServerCache() {
        client.writeDevLog('Beginning registration of new Servers...');
        client.guilds.cache.forEach(async guild => {
            client.writeDevLog(`Attempting to register Server \"${guild.name}\" in Database...`)

            const server = {
                id: BigInt(guild.id),
                name: guild.name
            }

            client.database.Server.add(server)
            .then(client.writeDevLog)
            .catch(client.logDevError);

            //Logfile Creation
            await this.checkServerLogger(guild);

            //Member Registration
            await this.registerMembers(guild);

            //Interval Creation
            this.createInterval(guild);

            //Command Registration
            await this.registerServerCommands(guild);
        });
    }

    static async registerMembers(guild: Guild) {
        await client.writeServerLog(guild, 'Beginning Member Registration - Searching Database for Members...');

        client.database.Server.members.getAll(guild)
        .then(async members => {
            await client.writeServerLog(guild, 'Found Members in Database, checking if they exist on the Server...')

            for (const member of members) {
                if (!guild.members.cache.has(String(member.id))) {
                    await client.writeServerLog(guild, `Could not find \"${member.displayName || member.user.display_name}\" in the Server - Removing from Database...`);

                    client.database.Server.members.remove(guild, member)
                    .then(async msg => await client.writeServerLog(guild, msg))
                    .catch(async err => await client.logServerError(guild, err));
                } else {
                    await client.writeServerLog(guild, `Found Member \"${member.displayName || member.user.display_name}\" in Server - Skipping...`);
                    continue;
                }
            }
        })
        .catch(async err => await client.logServerError(guild, err));

        guild.members.cache.forEach(async member => {
            if (!member.user.bot) {
                client.database.Server.members.add(guild, member)
                .then(async msg => await client.writeServerLog(guild, msg))
                .catch(async err => {
                    if (!(err instanceof DuplicateError)) {
                        client.logServerError(guild, err);
                    }
                });
            }
        });
    }

    static createInterval(guild: Guild) {
        setInterval(async () => {
            const dbServer = await client.database.Server.getOne(guild);

            if (dbServer.print_logs) {
                if (dbServer.log_channelid) {
                    const channel = guild.channels.cache.get(String(dbServer.log_channelid)) as TextChannel;

                    await client.writeServerLog(guild, 'Printing Logfile...');

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
                } else {
                    const err = new NotFoundError('No Log Channel defined', 'This Server does not have a Logchannel defined in the Database!');
                    await client.logServerError(guild, err);
                }
            }

            await this.checkServerLogger(guild);
        }, 1000 * 60 * 60 * 24);
    }

    static async registerServerCommands(guild: Guild) {
        const commandsArray = Array.from(client.slashCommands).values() as unknown as ApplicationCommandDataResolvable[];

        guild.commands.set(commandsArray)
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

        client.writeServerLog(guild, 'Finished registering Server Commands - Bot is now ready!')
    }
}

export default Event;