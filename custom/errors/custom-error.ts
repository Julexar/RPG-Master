class CustomError extends Error {
    cause: string;

    constructor(message: string, code: number, cause: string) {
        super(message || 'Something went wrong!');
        this.name = `Error ${code || '500'}`;
        this.cause = cause;
    }
}

export { CustomError };
