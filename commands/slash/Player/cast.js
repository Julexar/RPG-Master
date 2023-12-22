class Command {
    constructor() {
        this.name = 'cast';
        this.description = 'Casts a Spell';
        this.enabled = false;
    }

    async run(client, interaction) {}
}
export default new Command();
