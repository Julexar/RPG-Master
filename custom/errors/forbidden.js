import { CustomError } from './custom-error.js';

class ForbiddenError extends CustomError {
    constructor(message, cause) {
        super(message || 'Forbidden', 403, cause);
    }
}

export { ForbiddenError };
