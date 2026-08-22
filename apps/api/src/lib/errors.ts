/** Errors that are safe to render to a client verbatim. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Not permitted') {
    return new ApiError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }
  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }
  static tooMany(message = 'Slow down') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
  static upstream(message: string) {
    return new ApiError(502, 'UPSTREAM_FAILURE', message);
  }
  /**
   * We are up, but temporarily cannot do this. Distinct from 500: the client
   * should retry, and the shared ApiFailure contract marks 503 as retryable.
   */
  static unavailable(message: string) {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }
}
