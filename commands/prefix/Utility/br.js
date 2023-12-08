class Command {
    constructor() {
        this.name = 'br';
        this.description = 'Prints a line break';
        this.args = false;
    }

    async run(client, message, args) {}
}
export default new Command();
