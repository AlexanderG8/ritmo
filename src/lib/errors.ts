/** Error esperado y mostrable al usuario. Cualquier otro error es un bug. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function messageFor(error: unknown): string {
  if (error instanceof ValidationError) return error.message;
  throw error;
}
