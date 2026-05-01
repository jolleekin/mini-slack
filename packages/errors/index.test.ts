import { describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "./index.ts";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should set custom error code and metadata", () => {
      const metadata = { foo: "bar" };
      const error = new AppError("FORBIDDEN", { i18nKey: "key", metadata });
      expect(error.code).toBe("FORBIDDEN");
      expect(error.i18nKey).toBe("key");
      expect(error.data).toEqual(metadata);
    });
  });

  describe("NotFoundError", () => {
    it("should have NOT_FOUND code", () => {
      const error = new NotFoundError();
      expect(error.code).toBe("NOT_FOUND");
    });
  });

  describe("ValidationError", () => {
    it("should have VALIDATION code", () => {
      const error = new ValidationError();
      expect(error.code).toBe("VALIDATION");
    });
  });

  describe("UnauthorizedError", () => {
    it("should have UNAUTHENTICATED code", () => {
      const error = new UnauthenticatedError();
      expect(error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("ForbiddenError", () => {
    it("should have FORBIDDEN code", () => {
      const error = new ForbiddenError();
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  describe("ConflictError", () => {
    it("should have CONFLICT code", () => {
      const error = new ConflictError();
      expect(error.code).toBe("CONFLICT");
    });
  });
});
