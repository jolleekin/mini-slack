import { idSequences } from "@mini-slack/db/index.ts";
import { ExtractTablesWithRelations, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PgliteTransaction } from "drizzle-orm/pglite";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

/**
 * Snowflake ID Generator
 *
 * Generates 64-bit distributed unique IDs with the following structure:
 * [Sign: 1][Timestamp: 41][Data: 22]
 *
 * Data can be:
 * - [Random: 22]           (Strategy 1: For low-frequency entities)
 * - [Sequence: 22]         (Strategy 2: For DB-backed entities)
 * - [Machine ID: 10][Seq: 12] (Strategy 3: Original Snowflake)
 * @module
 */

// --- Core Utils & Types ---

/**
 * Custom epoch: 2026-01-01T00:00:00.000Z.
 */
export const CUSTOM_EPOCH = 1767225600000n;

// Bit allocations.
const DATA_BITS = 22n;
const MACHINE_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;

// Maximum values.
const MAX_DATA = (1n << DATA_BITS) - 1n; // 4095
const MAX_MACHINE_ID = (1n << MACHINE_ID_BITS) - 1n; // 1023
const MAX_SEQUENCE = MAX_DATA;

// Bit shifts.
const MACHINE_ID_SHIFT = SEQUENCE_BITS;
const TIMESTAMP_SHIFT = DATA_BITS;

/**
 * Unique ID type (64-bit BigInt as string).
 */
export type Id = string;

/**
 * Parsed ID components.
 */
export interface ParsedId {
  timestamp: Date;
  machineId?: number;
  sequence?: number;
  data: bigint;
}

/**
 * Constructs an ID from timestamp and data components.
 */
function constructId(timestamp: bigint, data: bigint): Id {
  if (data < 0n || data > MAX_DATA) {
    throw new Error(`Data must be between 0 and ${MAX_DATA}, got ${data}`);
  }
  const id = ((timestamp - CUSTOM_EPOCH) << TIMESTAMP_SHIFT) | data;
  return id.toString();
}

/**
 * Parses an ID into its components.
 */
export function parseId(id: Id): ParsedId {
  const idBigInt = BigInt(id);
  const timestamp = new Date(
    Number((idBigInt >> TIMESTAMP_SHIFT) + CUSTOM_EPOCH),
  );
  const data = idBigInt & MAX_DATA;

  const machineId = Number(data >> MACHINE_ID_SHIFT);
  const sequence = Number(data & MAX_SEQUENCE);

  return {
    timestamp,
    machineId,
    sequence,
    data,
  };
}

// --- Strategy 1: Random ID ---

/**
 * Generates a random-based ID for low-frequency entities.
 */
export function generateRandomId(): Id {
  const timestamp = BigInt(Date.now());
  const randomBuffer = new BigUint64Array(1);
  crypto.getRandomValues(randomBuffer);
  const data = randomBuffer[0] & MAX_DATA;
  return constructId(timestamp, data);
}

// --- Strategy 2: Sequential ID (DB-backed) ---

type Schema = {
  idSequences: typeof idSequences;
};

/**
 * Generates a strictly increasing Snowflake ID within a specific partition using a database sequence.
 */
export async function generateSequentialId(
  tx:
    | PgTransaction<
        PostgresJsQueryResultHKT,
        Schema,
        ExtractTablesWithRelations<Schema>
      >
    | PgliteTransaction<Schema, ExtractTablesWithRelations<Schema>>,
  key1: string,
  key2: string,
  realm: string,
): Promise<Id> {
  const now = BigInt(Date.now());

  const [row] = await tx
    .insert(idSequences)
    .values({
      key1,
      key2,
      realm,
      lastTimestamp: now,
      sequence: 0n,
    })
    .onConflictDoUpdate({
      target: [idSequences.key1, idSequences.key2, idSequences.realm],
      set: {
        sequence: sql`CASE WHEN ${idSequences.lastTimestamp} = ${now} THEN ${idSequences.sequence} + 1 ELSE 0 END`,
        lastTimestamp: now,
      },
    })
    .returning();

  return constructId(row.lastTimestamp, row.sequence);
}

// --- Strategy 3: Snowflake ID (Machine-ID backed) ---

// Clock skew handling
const DEFAULT_CLOCK_SKEW_TOLERANCE_MS = 5;
const CLOCK_CATCHUP_TIMEOUT_MS = 1000;

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
   * @default 5
   */
  clockSkewTolerance?: number;
}

/**
 * Original Snowflake ID Generator class (Machine ID + Sequence).
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
  generate(): Id {
    let timestamp = this.getCurrentTimestamp();

    if (timestamp < this.#lastTimestamp) {
      const drift = this.#lastTimestamp - timestamp;

      if (drift <= this.#clockSkewTolerance) {
        timestamp = this.#waitForClockCatchup(this.#lastTimestamp);
      } else {
        throw new Error(
          `Clock moved backwards by ${drift}ms, beyond tolerance of ${this.#clockSkewTolerance}ms.`,
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

    const data = (this.#machineId << MACHINE_ID_SHIFT) | this.#sequence;
    return constructId(timestamp, data);
  }

  /**
   * Gets current timestamp in milliseconds.
   */
  getCurrentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  #waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.getCurrentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.getCurrentTimestamp();
    }
    return timestamp;
  }

  #waitForClockCatchup(targetTimestamp: bigint): bigint {
    const startTime = Date.now();
    let timestamp = this.getCurrentTimestamp();

    while (timestamp <= targetTimestamp) {
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

// Singleton instance for standard Snowflake generation.
let snowflakeGenerator: SnowflakeGenerator | null = null;

/**
 * Initializes the Snowflake ID generator.
 */
export function initializeSnowflakeGenerator(
  options?: Partial<SnowflakeGeneratorOptions>,
): void {
  const machineId =
    options?.machineId ?? parseInt(process.env.MACHINE_ID ?? "0", 10);
  const clockSkewTolerance =
    options?.clockSkewTolerance ?? DEFAULT_CLOCK_SKEW_TOLERANCE_MS;

  snowflakeGenerator = new SnowflakeGenerator({
    machineId,
    clockSkewTolerance,
  });
}

/**
 * Generates a standard Snowflake ID using the singleton instance.
 */
export function generateSnowflakeId(): Id {
  if (!snowflakeGenerator) initializeSnowflakeGenerator();
  return snowflakeGenerator!.generate();
}
