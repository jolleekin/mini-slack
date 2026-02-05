import { describe, it, expect, beforeEach } from "vitest";
import {
  generateId,
  parseId,
  idToString,
  stringToId,
  initGenerator,
  SnowflakeGenerator,
  CUSTOM_EPOCH,
} from "./index";

describe("Snowflake ID Generator", () => {
  beforeEach(() => {
    // Reset generator before each test
    initGenerator({ machineId: 0 });
  });

  describe("SnowflakeGenerator", () => {
    it("should generate unique IDs", () => {
      const generator = new SnowflakeGenerator({ machineId: 1 });
      const id1 = generator.generate();
      const id2 = generator.generate();

      expect(id1).not.toBe(id2);
      expect(id2).toBeGreaterThan(id1);
    });

    it("should throw error for invalid machine ID", () => {
      expect(() => new SnowflakeGenerator({ machineId: -1 })).toThrow();
      expect(() => new SnowflakeGenerator({ machineId: 1024 })).toThrow();
    });

    it("should handle sequence overflow within same millisecond", () => {
      const generator = new SnowflakeGenerator({ machineId: 0 });
      const ids = new Set<bigint>();

      // Generate multiple IDs rapidly
      for (let i = 0; i < 100; i++) {
        ids.add(generator.generate());
      }

      expect(ids.size).toBe(100);
    });

    it("should include machine ID in generated IDs", () => {
      const machineId = 42;
      const generator = new SnowflakeGenerator({ machineId });
      const id = generator.generate();
      const parsed = parseId(id);

      expect(parsed.machineId).toBe(machineId);
    });
  });

  describe("generateId", () => {
    it("should generate valid IDs using singleton", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id2).toBeGreaterThan(id1);
    });

    it("should use MACHINE_ID from environment", () => {
      process.env.MACHINE_ID = "123";
      initGenerator();

      const id = generateId();
      const parsed = parseId(id);

      expect(parsed.machineId).toBe(123);

      delete process.env.MACHINE_ID;
    });
  });

  describe("parseId", () => {
    it("should correctly parse a Snowflake ID", () => {
      const id = generateId();
      const parsed = parseId(id);

      expect(parsed.timestamp).toBeInstanceOf(Date);
      expect(parsed.machineId).toBeGreaterThanOrEqual(0);
      expect(parsed.machineId).toBeLessThanOrEqual(1023);
      expect(parsed.sequence).toBeGreaterThanOrEqual(0);
      expect(parsed.sequence).toBeLessThanOrEqual(4095);
    });

    it("should parse timestamp relative to custom epoch", () => {
      const id = generateId();
      const parsed = parseId(id);
      const now = Date.now();

      // Timestamp should be close to current time (within 1 second)
      expect(Math.abs(parsed.timestamp.getTime() - now)).toBeLessThan(1000);
    });

    it("should correctly extract machine ID", () => {
      initGenerator({ machineId: 456 });
      const id = generateId();
      const parsed = parseId(id);

      expect(parsed.machineId).toBe(456);
    });
  });

  describe("String conversion", () => {
    it("should convert ID to string and back", () => {
      const id = generateId();
      const str = idToString(id);
      const converted = stringToId(str);

      expect(typeof str).toBe("string");
      expect(converted).toBe(id);
    });

    it("should handle large IDs", () => {
      const largeId = (1n << 63n) - 1n;
      const str = idToString(largeId);
      const converted = stringToId(str);

      expect(converted).toBe(largeId);
    });
  });

  describe("CUSTOM_EPOCH", () => {
    it("should use custom epoch of 2026-01-01", () => {
      const expectedEpoch = new Date("2026-01-01T00:00:00.000Z").getTime();
      expect(Number(CUSTOM_EPOCH)).toBe(expectedEpoch);
    });
  });

  describe("ID structure", () => {
    it("should generate IDs with correct bit structure", () => {
      const id = generateId();
      const parsed = parseId(id);

      // Verify all components are within valid ranges
      expect(parsed.timestamp.getTime()).toBeGreaterThanOrEqual(
        Number(CUSTOM_EPOCH),
      );
      expect(parsed.machineId).toBeGreaterThanOrEqual(0);
      expect(parsed.machineId).toBeLessThanOrEqual(1023);
      expect(parsed.sequence).toBeGreaterThanOrEqual(0);
      expect(parsed.sequence).toBeLessThanOrEqual(4095);
    });

    it("should maintain monotonic ordering", () => {
      const ids: bigint[] = [];

      for (let i = 0; i < 1000; i++) {
        ids.push(generateId());
      }

      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });
  });

  describe("Clock Skew Compensation", () => {
    it("should use default 5ms tolerance", () => {
      const generator = new SnowflakeGenerator({ machineId: 0 });
      const id = generator.generate();
      expect(id).toBeDefined();
    });

    it("should accept custom clock skew tolerance", () => {
      const generator = new SnowflakeGenerator({
        machineId: 0,
        clockSkewTolerance: 10,
      });
      const id = generator.generate();
      expect(id).toBeDefined();
    });

    it("should throw error for large backward drift", () => {
      const generator = new SnowflakeGenerator({
        machineId: 0,
        clockSkewTolerance: 5,
      });

      generator.generate();

      const originalGetTime = generator.getCurrentTimestamp;

      generator.getCurrentTimestamp = function () {
        return originalGetTime.call(this) - 10n;
      };

      expect(() => generator.generate()).toThrow(/Clock moved backwards by/);
    });

    it("should wait for clock to catch up for small backward drift", () => {
      const generator = new SnowflakeGenerator({
        machineId: 0,
        clockSkewTolerance: 5,
      });

      const id0 = generator.generate();

      const originalGetTime = generator.getCurrentTimestamp;

      generator.getCurrentTimestamp = function () {
        return originalGetTime.call(this) - 2n;
      };

      const id1 = generator.generate();
      expect(id1).toBeGreaterThan(id0);
    });
  });
});
