export class AppError extends Error {
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, status = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, details);
  }
}

export class DbError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}
