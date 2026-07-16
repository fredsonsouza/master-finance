export class ResourceNotFoundError extends Error {
  public readonly statusCode = 404

  constructor(message?: string) {
    super(message ?? 'Resource not found')
  }
}
