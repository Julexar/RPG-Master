import { client } from '../..';

class Event {
    constructor() {
        this.name = 'guildUpdate';
    }

    /**
     *
     * @param {import("discord.js").Guild} newGuild
     */
    async run(newGuild) {
        await client.database.Server.update(newGuild)
        .then(msg => client.writeServerLog(newGuild, msg))
        .catch(err => client.logServerError(newGuild, err))
    }
}

export default new Event();