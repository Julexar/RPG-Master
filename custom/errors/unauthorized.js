import { CustomError } from './custom-error.js';

class UnauthorizedError extends CustomError {
    constructor(message, cause) {
        super(message || 'Unauthorized', 401, cause);
    }
}

export { UnauthorizedError };
