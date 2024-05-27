import { CustomError } from './custom-error.ts';

class UnauthorizedError extends CustomError {
    constructor(message: string, cause: string) {
        super(message || 'Unauthorized', 401, cause);
    }
}

export { UnauthorizedError };
