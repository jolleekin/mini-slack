/**
 * Snowflake ID Generator
 *
 * Generates 64-bit distributed unique IDs with the following structure:
 * - 41 bits: Timestamp (milliseconds since custom epoch)
 * - 10 bits: Machine ID (0-1023)
 * - 12 bits: Sequence number (0-4095)
 *
 * Custom Epoch: 2026-01-01T00:00:00.000Z (1735689600000 ms)
 */

// Custom epoch: 2026-01-01T00:00:00.000Z
export const CUSTOM_EPOCH = 1767225600000n;

// Bit allocations
const MACHINE_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;

// Maximum values.
const MAX_MACHINE_ID = (1n << MACHINE_ID_BITS) - 1n; // 1023
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n; // 4095

// Bit shifts.
const MACHINE_ID_SHIFT = SEQUENCE_BITS;
const TIMESTAMP_SHIFT = MACHINE_ID_BITS + SEQUENCE_BITS;

// Clock skew handling.
const DEFAULT_CLOCK_SKEW_TOLERANCE_MS = 5; // 5ms default tolerance.
const CLOCK_CATCHUP_TIMEOUT_MS = 1000; // Max 1 second wait for clock to catch up.

/**
 * Snowflake ID type (64-bit BigInt).
 */
export type SnowflakeId = bigint;

/**
 * Parsed Snowflake ID components.
 */
export interface ParsedSnowflakeId {
  timestamp: Date;
  machineId: number;
  sequence: number;
}

/**
 * Configuration options for Snowflake ID generator.
 */
export interface SnowflakeGeneratorOptions {
  /**
   * Unique machine identifier (0-1023).
   */
  machineId: number;
  /**
   * Maximum allowed backward clock drift in milliseconds.
   * If clock moves backward within this threshold, generator will wait.
   * If beyond threshold, generator will throw an error.
   * @default 5
   */
  clockSkewTolerance?: number;
}

/**
 * Snowflake ID Generator class.
 */
export class SnowflakeGenerator {
  #machineId: bigint;
  #sequence: bigint = 0n;
  #lastTimestamp: bigint = -1n;
  #clockSkewTolerance: bigint;

  constructor(options: SnowflakeGeneratorOptions) {
    const machineIdBigInt = BigInt(options.machineId);

    if (machineIdBigInt < 0n || machineIdBigInt > MAX_MACHINE_ID) {
      throw new Error(
        `Machine ID must be between 0 and ${MAX_MACHINE_ID}, got ${options.machineId}`,
      );
    }

    this.#machineId = machineIdBigInt;
    this.#clockSkewTolerance = BigInt(
      options.clockSkewTolerance ?? DEFAULT_CLOCK_SKEW_TOLERANCE_MS,
    );
  }

  /**
   * Generates a new Snowflake ID.
   */
  generate(): SnowflakeId {
    let timestamp = this.getCurrentTimestamp();

    if (timestamp < this.#lastTimestamp) {
      const drift = this.#lastTimestamp - timestamp;

      if (drift <= this.#clockSkewTolerance) {
        timestamp = this.#waitForClockCatchup(this.#lastTimestamp);
      } else {
        throw new Error(
          `Clock moved backwards by ${drift}ms, beyond tolerance of ${this.#clockSkewTolerance}ms. ` +
            `Refusing to generate ID to prevent duplicates.`,
        );
      }
    }

    if (timestamp === this.#lastTimestamp) {
      this.#sequence = (this.#sequence + 1n) & MAX_SEQUENCE;

      if (this.#sequence === 0n) {
        timestamp = this.#waitNextMillis(this.#lastTimestamp);
      }
    } else {
      this.#sequence = 0n;
    }

    this.#lastTimestamp = timestamp;

    const id =
      ((timestamp - CUSTOM_EPOCH) << TIMESTAMP_SHIFT) |
      (this.#machineId << MACHINE_ID_SHIFT) |
      this.#sequence;

    return id;
  }

  /**
   * Gets current timestamp in milliseconds.
   *
   * This method is public solely for testing purposes.
   */
  getCurrentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  /**
   * Waits for the next millisecond.
   */
  #waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.getCurrentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.getCurrentTimestamp();
    }
    return timestamp;
  }

  /**
   * Waits for the clock to catch up after a minor backward drift.
   * Times out after CLOCK_CATCHUP_TIMEOUT_MS to prevent infinite waits.
   */
  #waitForClockCatchup(targetTimestamp: bigint): bigint {
    const startTime = Date.now();
    let timestamp = this.getCurrentTimestamp();

    while (timestamp <= targetTimestamp) {
      // Check for timeout
      if (Date.now() - startTime > CLOCK_CATCHUP_TIMEOUT_MS) {
        throw new Error(
          `Timeout waiting for clock to catch up. Clock has been behind for ${CLOCK_CATCHUP_TIMEOUT_MS}ms.`,
        );
      }
      timestamp = this.getCurrentTimestamp();
    }

    return timestamp;
  }
}

// Singleton instance.
let generatorInstance: SnowflakeGenerator | null = null;

/**
 * Initializes the Snowflake ID generator with configuration options.
 */
export function initGenerator(
  options?: Partial<SnowflakeGeneratorOptions>,
): void {
  const machineId =
    options?.machineId ?? parseInt(process.env.MACHINE_ID ?? "0", 10);
  const clockSkewTolerance =
    options?.clockSkewTolerance ?? DEFAULT_CLOCK_SKEW_TOLERANCE_MS;

  generatorInstance = new SnowflakeGenerator({
    machineId,
    clockSkewTolerance,
  });
}

/**
 * Generates a new Snowflake ID.
 *
 * @returns A 64-bit BigInt Snowflake ID.
 */
export function generateId(): SnowflakeId {
  if (!generatorInstance) initGenerator();
  return generatorInstance!.generate();
}

/**
 * Parse a Snowflake ID into its components.
 */
export function parseId(id: SnowflakeId): ParsedSnowflakeId {
  const timestamp = new Date(Number((id >> TIMESTAMP_SHIFT) + CUSTOM_EPOCH));
  const machineId = Number((id >> MACHINE_ID_SHIFT) & MAX_MACHINE_ID);
  const sequence = Number(id & MAX_SEQUENCE);

  return {
    timestamp,
    machineId,
    sequence,
  };
}

/**
 * Converts a Snowflake ID BigInt to a string.
 */
export function idToString(id: SnowflakeId): string {
  return id.toString();
}

/**
 * Converts a string to a Snowflake ID BigInt.
 */
export function stringToId(id: string): SnowflakeId {
  return BigInt(id);
}
