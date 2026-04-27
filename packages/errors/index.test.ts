import { describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./index.ts";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should set default error code to INTERNAL", () => {
      const error = new AppError("Test error");
      expect(error.code).toBe("INTERNAL");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("AppError");
    });

    it("should set custom error code and metadata", () => {
      const metadata = { foo: "bar" };
      const error = new AppError("Test error", "FORBIDDEN", metadata);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe("NotFoundError", () => {
    it("should have NOT_FOUND code", () => {
      const error = new NotFoundError();
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found");
    });
  });

  describe("ValidationError", () => {
    it("should have VALIDATION code", () => {
      const error = new ValidationError();
      expect(error.code).toBe("VALIDATION");
      expect(error.message).toBe("Validation failed");
    });
  });

  describe("UnauthorizedError", () => {
    it("should have UNAUTHENTICATED code", () => {
      const error = new UnauthorizedError();
      expect(error.code).toBe("UNAUTHENTICATED");
      expect(error.message).toBe("Unauthorized");
    });
  });

  describe("ForbiddenError", () => {
    it("should have FORBIDDEN code", () => {
      const error = new ForbiddenError();
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Forbidden");
    });
  });

  describe("ConflictError", () => {
    it("should have CONFLICT code", () => {
      const error = new ConflictError();
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toBe("Conflict");
    });
  });
});
