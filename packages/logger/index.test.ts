import { describe, it, expect, vi } from "vitest";
import { logger } from "./index.ts";

describe("Logger", () => {
  it("should log an info message", () => {
    const spy = vi.spyOn(logger, "info");
    logger.info("test message");
    expect(spy).toHaveBeenCalledWith("test message");
  });

  it("should create a child logger with context", () => {
    const context = { workspace_id: "123" };
    const child = logger.child(context);
    const spy = vi.spyOn(child, "info");

    child.info("child message");

    expect(spy).toHaveBeenCalledWith("child message");
  });

  it("should allow setting log level", () => {
    logger.level = "debug";
    expect(logger.level).toBe("debug");
  });
});
