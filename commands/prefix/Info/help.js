class Command {
    constructor() {
        this.name = 'help';
        this.description = 'Displays Info about Commands';
        this.args = true;
        this.optional = true;
        this.usage = ['--<command>'];
    }

    async run(client, message, args) {}
}
export default new Command();
