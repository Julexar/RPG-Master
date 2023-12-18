class Command {
    constructor() {
        this.name = 'ping';
        this.description = 'Get a ping from the Bot';
        this.args = false;
    }

    async run(client, message, args) {}
}
export default new Command();
