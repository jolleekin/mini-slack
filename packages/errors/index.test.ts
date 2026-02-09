import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "./index.ts";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should set default status code to 500", () => {
      const error = new AppError("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("AppError");
    });

    it("should set custom status code and metadata", () => {
      const metadata = { foo: "bar" };
      const error = new AppError("Test error", 503, metadata);
      expect(error.statusCode).toBe(503);
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe("NotFoundError", () => {
    it("should have status code 404", () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
    });
  });

  describe("ValidationError", () => {
    it("should have status code 400", () => {
      const error = new ValidationError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Validation failed");
    });
  });

  describe("UnauthorizedError", () => {
    it("should have status code 401", () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized");
    });
  });

  describe("ForbiddenError", () => {
    it("should have status code 403", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Forbidden");
    });
  });

  describe("ConflictError", () => {
    it("should have status code 409", () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Conflict");
    });
  });
});
