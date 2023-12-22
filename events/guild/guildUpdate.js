import { client } from '../../index.js';
class Event {
    constructor() {
        this.name = 'guildUpdate';
    }
    /**
     *
     * @param {import("discord.js").Guild} newGuild
     */
    async run(newGuild) {
        const server = client.guilds.cache.get(newGuild.id);
        await client.database
            .updateServer(server)
            .then(async (msg) => {
                await client.database
                    .writeLog(server, msg)
                    .then((msg1) => client.database.writeDevLog(msg1))
                    .catch((err) => client.database.writeDevLog(`${err}`));
            })
            .catch(async (err) => {
                await client.database
                    .writeLog(server, `${err}`)
                    .then((msg) => client.database.writeDevLog(msg))
                    .catch((err1) => client.database.writeDevLog(`${err1}`));
            });
    }
}
export default new Event();
