export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function assertAuthenticated(isAuthenticated: boolean): void {
  if (!isAuthenticated) {
    throw new UnauthorizedError("User must be logged in to access this page.");
  }
}
