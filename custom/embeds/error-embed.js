import { CustomEmbed } from "./custom-embed.js";

class ErrorEmbed extends CustomEmbed {
    constructor(err) {
        if (!err.name && !err.cause) {
            super("An Error occurred...", err, "#FF0000");
        } else {
            super(err.name + err.message, err.cause, "#FF0000");
        }
    };
};

export { ErrorEmbed };