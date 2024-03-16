import { Guild } from 'discord.js';
import { client } from '../..';

class Event {
    name: string;
    constructor() {
        this.name = 'guildUpdate';
    }

    async run(guild: Guild) {
        await client.database.Server.update(guild)
        .then(msg => client.writeServerLog(guild, msg))
        .catch(err => client.logServerError(guild, err))
    }
}

export default new Event();