class CustomError extends Error {
    constructor(message, code, cause) {
        super(message || "Something went wrong!");
        this.name = "Error " + code || 500;
        this.cause = cause;
    }
}
export { CustomError };