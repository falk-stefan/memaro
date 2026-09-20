export class ApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly message: string,
  ) {
    super();
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource?: string) {
    super(404, `Not Found${resource ? `: ${resource}` : ''}}`);
  }
}
