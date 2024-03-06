import { Guild } from 'discord.js';
import { client } from '../..';

class Event {
    name: string;
    constructor() {
        this.name = 'guildDelete';
    }

    async run(guild: Guild) {
        await client.database.Server.remove(guild)
        .then(client.writeDevLog)
        .catch(client.logDevError)
    }
}

export default new Event();
