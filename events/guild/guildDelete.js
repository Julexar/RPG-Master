import { client } from '../..';

class Event {
    constructor() {
        this.name = 'guildDelete';
    }

    /**
     *
     * @param {import("discord.js").Guild} guild
     */
    async run(guild) {
        await client.database.Server.remove(guild).then(client.writeDevLog).catch(client.logDevError);
    }
}

export default new Event();
