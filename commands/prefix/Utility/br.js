import { CommandBuilder } from "../../../custom/builders";

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.args = false;
        this.enabled = true;
    }

    /**
     * @param {import("discord.js").Message} message
     * @param {string[]} args
     */
    async run(message, args) {
        await message.channel.send('\`\`\`\n \`\`\`');
    }
}

const command = new Command({
    name: 'br',
    description: 'Prints a line break'
});

export { command };