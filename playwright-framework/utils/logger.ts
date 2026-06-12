export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    console.log(`[INFO][${this.timestamp()}][${this.context}] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN][${this.timestamp()}][${this.context}] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR][${this.timestamp()}][${this.context}] ${message}`, error?.stack || '');
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG][${this.timestamp()}][${this.context}] ${message}`);
    }
  }

  private timestamp(): string {
    return new Date().toISOString();
  }
}
