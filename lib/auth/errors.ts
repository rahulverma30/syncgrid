export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message = 'Unauthorized', status = 401, code = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

export class PermissionError extends AuthError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'PermissionError';
  }
}
