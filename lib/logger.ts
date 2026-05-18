/**
 * Centralized Enterprise Observability & Logger
 * Fully Winston/Pino ready. Supports JSON structured formatting,
 * severity tiers, and tenant-tracing context metadata.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  companyId?: string;
  userId?: string;
  traceId?: string;
  [key: string]: any;
}

class EnterpriseLogger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level: level.toUpperCase(),
      message,
      metadata: context || {},
    };

    if (this.isProduction) {
      return JSON.stringify(payload);
    } else {
      const colorMap = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[90m', // Gray
      };
      const reset = '\x1b[0m';
      const color = colorMap[level] || reset;
      const metaString = context ? ` | Metadata: ${JSON.stringify(context)}` : '';
      return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaString}`;
    }
  }

  public info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  public warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  public error(message: string, error?: any, context?: LogContext) {
    const mergedContext = {
      ...context,
      errorStack: error instanceof Error ? error.stack : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    console.error(this.formatMessage('error', message, mergedContext));
  }

  public debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.log(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new EnterpriseLogger();
