'use strict';

/**
 * Friendly error class. Anything thrown as an ApiError is shown to the user
 * exactly as written; every other error is hidden behind a generic message so
 * stack traces and technical details never reach the browser.
 */
class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'You need to sign in to continue.') {
    return new ApiError(401, message);
  }

  static notFound(message = 'We could not find what you were looking for.') {
    return new ApiError(404, message);
  }

  static server(message = 'Something went wrong on our side. Please try again.') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
