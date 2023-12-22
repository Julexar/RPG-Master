import { client } from '../../index.js';
class Event {
    constructor() {
        this.name = 'guildMemberRemove';
    }
    /**
     *
     * @param {import("discord.js").GuildMember} member
     */
    async run(member) {
        const server = client.guilds.cache.get(member.guild.id);
        await client.database
            .remMember(server, member.user)
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
