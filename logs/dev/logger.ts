import { createLogger, format, transports } from 'winston';
const { printf } = format;
const myFormat = printf(info => `${info.message}`);

export const devlog = createLogger({
    format: format.combine(
        format.timestamp(),
        myFormat
    ),
    transports: [
        new transports.File({ filename: './logs/dev/devlog.log' })
    ]
});