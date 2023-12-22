class Command {
    constructor() {
        this.name = 'check';
        this.nick = 'c';
        this.description = 'Rolls a Skill or Ability Check';
        this.enabled = false;
    }

    async run(client, interaction) {}
}
export default new Command();
