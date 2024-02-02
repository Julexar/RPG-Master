import { CustomError } from './custom-error.ts';

class ForbiddenError extends CustomError {
    constructor(message: string, cause: string) {
        super(message || 'Forbidden', 403, cause);
    }
}

export { ForbiddenError };