import { CommandBuilder } from "../../../custom/builders";
import { client } from '../../..';
import { ListEmbed } from "../../../custom/embeds";

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.name = 'ping';
        this.description = 'Get a ping from the Bot';
        this.args = false;
    }

    /**
     * @param {import("discord.js").Message} message
     * @param {string[]} args
     */
    async run(message, args) {
        const embed = new ListEmbed('Pong!', `Bot Latency: ${Date.now() - message.createdTimestamp}ms\nSocket Latency: ${client.ws.ping}ms`, null);

        await message.reply({
            embeds: [embed]
        });
    }
}

const command = new Command({
    name: 'ping',
    description: 'Get a ping from the Bot'
});

export { command };