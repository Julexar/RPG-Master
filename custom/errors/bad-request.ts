import { CustomError } from './custom-error.ts';

class BadRequestError extends CustomError {
    constructor(message: string, cause: string) {
        super(message || 'Bad Request', 400, cause);
    }
}

export { BadRequestError };