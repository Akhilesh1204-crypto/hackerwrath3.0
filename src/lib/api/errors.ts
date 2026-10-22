export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  get isAuthError() {
    return this.code === 'UNAUTHORIZED' || this.status === 401;
  }

  get isForbidden() {
    return this.code === 'FORBIDDEN' || this.status === 403;
  }

  /** Field-level messages from a Zod `error.format()` payload, if present. */
  get fieldErrors(): Record<string, string> {
    const output: Record<string, string> = {};
    const details = this.details as
      | { _errors?: string[]; [key: string]: unknown }
      | undefined;
    if (!details || typeof details !== 'object') return output;

    for (const [key, value] of Object.entries(details)) {
      if (key === '_errors') continue;
      const entry = value as { _errors?: string[] } | undefined;
      const message = entry?._errors?.[0];
      if (message) output[key] = message;
    }
    return output;
  }
}
