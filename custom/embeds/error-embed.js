import { CustomEmbed } from './custom-embed.js';

class ErrorEmbed extends CustomEmbed {
    constructor(err, custom) {
        if (custom) {
            super('An Error occurred...', err, '#FF0000');
        } else {
            super(`${err}`, `${err.cause}`, '#FF0000');
        }
    }
}

export { ErrorEmbed };
