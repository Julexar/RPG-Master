import { GuildMember } from 'discord.js';
import { client } from '../..';

class Event {
    name: string;
    constructor() {
        this.name = 'guildMemberRemove';
    }

    async run(member: GuildMember) {
        const server = member.guild;

        await client.database.Server.members.remove(server, member)
        .then(msg => client.writeServerLog(server, msg))
        .catch(err => client.logServerError(server, err))
    }
}

export default new Event();