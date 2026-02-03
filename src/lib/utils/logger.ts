/**
 * Logger utility for structured logging.
 * Provides standard methods for logging with consistent formatting.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Formats the log message with timestamp and level.
 * @param level The log level.
 * @param message The main log message.
 * @returns Formatted string.
 */
function formatMessage(level: LogLevel, message: string): string {
	const timestamp = new Date().toISOString();
	return `[${timestamp}] [${level}] ${message}`;
}

export const logger = {
	/**
	 * Log an informational message.
	 * @param message The message to log.
	 * @param data Optional data to include.
	 */
	info: (message: string, data?: unknown) => {
		console.info(formatMessage('INFO', message), data ? data : '');
	},

	/**
	 * Log a warning message.
	 * @param message The warning message.
	 * @param data Optional data to include.
	 */
	warn: (message: string, data?: unknown) => {
		console.warn(formatMessage('WARN', message), data ? data : '');
	},

	/**
	 * Log an error message.
	 * @param message The error message.
	 * @param error Optional error object or data.
	 */
	error: (message: string, error?: unknown) => {
		console.error(formatMessage('ERROR', message), error ? error : '');
	},

	/**
	 * Log a debug message.
	 * @param message The debug message.
	 * @param data Optional data to include.
	 */
	debug: (message: string, data?: unknown) => {
		console.debug(formatMessage('DEBUG', message), data ? data : '');
	}
};
