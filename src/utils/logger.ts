/**
 * Logger utility for consistent logging across the application
 */

// Log levels
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

// Current log level (can be set via environment variable)
const currentLogLevel = process.env.LOG_LEVEL 
    ? parseInt(process.env.LOG_LEVEL) 
    : LogLevel.INFO;

/**
 * Logger class with methods for different log levels
 */
class Logger {
    private formatMessage(level: string, message: any, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        const formattedMessage = typeof message === 'object' 
            ? JSON.stringify(message) 
            : message;
            
        return `[${timestamp}] [${level}] ${formattedMessage} ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`;
    }

    error(message: any, ...args: any[]): void {
        if (currentLogLevel >= LogLevel.ERROR) {
            console.error(this.formatMessage('ERROR', message, ...args));
        }
    }

    warn(message: any, ...args: any[]): void {
        if (currentLogLevel >= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', message, ...args));
        }
    }

    info(message: any, ...args: any[]): void {
        if (currentLogLevel >= LogLevel.INFO) {
            console.info(this.formatMessage('INFO', message, ...args));
        }
    }

    debug(message: any, ...args: any[]): void {
        if (currentLogLevel >= LogLevel.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message, ...args));
        }
    }

    // Log to file (to be implemented if needed)
    logToFile(level: string, message: string): void {
        // Implementation for file logging can be added here
    }
}

// Export a singleton instance
export const logger = new Logger();
