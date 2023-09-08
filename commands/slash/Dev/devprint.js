import { PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "devprint";
        this.description = "Prints the Devlog";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
    };

    async run(client, interaction) {

    }
}
export default new Command();