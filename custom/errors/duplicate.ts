import { CustomError } from './custom-error.ts';

class DuplicateError extends CustomError {
    constructor(message: string, cause: string) {
        super(message || 'Duplicate Record', 409, cause);
    }
}

export { DuplicateError };