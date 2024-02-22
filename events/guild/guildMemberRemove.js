import { client } from '../..';

class Event {
    constructor() {
        this.name = 'guildMemberRemove';
    }

    /**
     *
     * @param {import("discord.js").GuildMember} member
     */
    async run(member) {
        const server = member.guild;

        await client.database.Server.members
            .remove(server, member)
            .then(msg => client.writeServerLog(server, msg))
            .catch(err => client.logServerError(server, err));
    }
}

export default new Event();
