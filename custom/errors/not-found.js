import { CustomError } from "./custom-error.js";

class NotFoundError extends CustomError {
    constructor(message, cause) {
        super(message || "Not Found", 404, cause);
    }
}

export { NotFoundError };