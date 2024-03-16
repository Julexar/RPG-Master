import { Error } from '../../*';
import { CustomEmbed } from './custom-embed.ts';

class ErrorEmbed extends CustomEmbed {
    constructor(err: Error, custom: boolean) {
        if (custom) super('An Error occurred...', err.cause, 0xFF0000);
        else super(`${err}`, err.cause, 0xFF0000);
    }
}

export { ErrorEmbed };