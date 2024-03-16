import { CustomError } from './custom-error.ts';

class NotFoundError extends CustomError {
    constructor(message: string, cause: string) {
        super(message || 'Not Found', 404, cause);
    }
}

export { NotFoundError };