import pino, { Logger as PinoLogger } from "pino";

export class Logger {
  private logger: PinoLogger;

  constructor(name: string) {
    this.logger = pino({ name });
  }

  info(msg: string, data?: Record<string, unknown>) {
    this.logger.info(data || {}, msg);
  }

  error(msg: string, error?: Error | Record<string, unknown>) {
    if (error instanceof Error) {
      this.logger.error(
        {
          error: error.message,
          stack: error.stack,
        },
        msg
      );
    } else {
      this.logger.error(error || {}, msg);
    }
  }

  warn(msg: string, data?: Record<string, unknown>) {
    this.logger.warn(data || {}, msg);
  }

  debug(msg: string, data?: Record<string, unknown>) {
    this.logger.debug(data || {}, msg);
  }
}

export function getLogger(name: string): Logger {
  return new Logger(name);
}
