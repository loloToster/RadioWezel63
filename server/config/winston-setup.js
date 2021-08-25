const winston = require('winston')
const logConfiguration = {
    transports: [
        new winston.transports.File({
            filename: 'logs/logs.log'
        }),
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MM-YY HH:mm:ss'
        }),
        winston.format.printf(info => {
            return `${info.level}: ${info.timestamp} - ${info.message}`
        }),
    )
}

const logger = winston.createLogger(logConfiguration)
module.exports = logger

// Log a message
//logger.info("Some info")
