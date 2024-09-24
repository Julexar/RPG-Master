import { CustomError } from './custom-error.ts';

class InternalServerError extends CustomError {
    constructor(message: string, cause: string) {
        super(message || 'Internal Server', 500, cause);
    }
}

export { InternalServerError };