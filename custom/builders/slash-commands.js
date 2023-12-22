import { SlashCommandBuilder } from "discord.js";

class CommandBuilder extends SlashCommandBuilder {
    constructor (data) {
        super(data);
    }
};

export { CommandBuilder };