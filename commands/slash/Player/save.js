class Command {
    constructor() {
        this.name = 'save';
        this.nick = 's';
        this.description = 'Rolls a Saving Throw';
        this.enabled = false;
    }

    async run(client, interaction) {}
}
export default new Command();
