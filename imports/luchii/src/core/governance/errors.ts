export class GovernanceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "GovernanceError";
  }
}

export class ValidationError extends GovernanceError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends GovernanceError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ""}`,
      "NOT_FOUND",
      404
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends GovernanceError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends GovernanceError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ConstitutionalViolationError extends GovernanceError {
  constructor(message: string) {
    super(message, "CONSTITUTIONAL_VIOLATION", 422);
    this.name = "ConstitutionalViolationError";
  }
}

export class EvolutionBlockedError extends GovernanceError {
  constructor(reason: string) {
    super(`Evolution blocked: ${reason}`, "EVOLUTION_BLOCKED", 422);
    this.name = "EvolutionBlockedError";
  }
}
