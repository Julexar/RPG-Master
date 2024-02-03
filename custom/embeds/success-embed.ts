import { CustomEmbed } from './custom-embed.ts';

class SuccessEmbed extends CustomEmbed {
    constructor(title: string, description: string) {
        super(title, description, 0x65fe08);
    }
}

export { SuccessEmbed };
