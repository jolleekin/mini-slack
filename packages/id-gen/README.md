# @mini-slack/id-gen

Distributed Snowflake ID generator for the MiniSlack project.

## Features

- **64-bit unique IDs**: Generates BigInt IDs suitable for database primary keys
- **Custom Epoch**: Uses 2026-01-01 as the custom epoch
- **Distributed**: Supports up to 1024 machines via configurable machine IDs
- **High throughput**: Generates up to 4096 IDs per millisecond per machine
- **Monotonic**: IDs are sortable by creation time

## ID Structure

Each Snowflake ID is a 64-bit BigInt composed of:

```
┌─────────────────────────────────────────┬──────────────┬──────────────┐
│      Timestamp (41 bits)                │ Machine (10) │ Sequence (12)│
│      Milliseconds since epoch           │    0-1023    │   0-4095     │
└─────────────────────────────────────────┴──────────────┴──────────────┘
```

- **Timestamp** (41 bits): Milliseconds since custom epoch (2026-01-01)
- **Machine ID** (10 bits): Unique machine identifier (0-1023)
- **Sequence** (12 bits): Auto-incrementing sequence per millisecond (0-4095)

## Installation

This package is part of the mini-slack monorepo. No separate installation needed.

## Usage

### Basic Usage

```typescript
import { generateId } from "@mini-slack/id-gen";

// Generate a new ID
const id = generateId();
console.log(id); // 123456789012345678n
```

### Initialize with Custom Options

```typescript
import { initGenerator, generateId } from "@mini-slack/id-gen";

// Initialize with specific machine ID and custom clock skew tolerance.
initGenerator({
  machineId: 42,
  clockSkewTolerance: 10, // Wait up to 10ms for clock catch-up.
});

const id = generateId();
```

### Using Environment Variables

The generator automatically reads the `MACHINE_ID` environment variable:

```bash
MACHINE_ID=123 node your-app.js
```

```typescript
// Will use MACHINE_ID from environment
const id = generateId();
```

### Parse an ID

```typescript
import { parseId } from "@mini-slack/id-gen";

const id = 123456789012345678n;
const parsed = parseId(id);

console.log(parsed);
// {
//   timestamp: Date(2026-01-15T12:34:56.789Z),
//   machineId: 42,
//   sequence: 1234
// }
```

### String Conversion

```typescript
import { idToString, stringToId } from "@mini-slack/id-gen";

const id = generateId();
const str = idToString(id); // "123456789012345678"
const back = stringToId(str); // 123456789012345678n
```

```typescript
import type { SnowflakeId, ParsedSnowflakeId } from "@mini-slack/id-gen";

const id: SnowflakeId = generateId();
const parsed: ParsedSnowflakeId = parseId(id);
```

## API Reference

### `generateId(): bigint`

Generates a new Snowflake ID.

**Returns**: A 64-bit BigInt representing the unique ID.

### `initGenerator(options?: Partial<SnowflakeGeneratorOptions>): void`

Initializes the ID generator with configuration options.

**Parameters**:

- `options` (optional):
  - `machineId`: Machine ID (0-1023). Defaults to `MACHINE_ID` env var or 0.
  - `clockSkewTolerance`: Max ms to wait for backward clock drifts. Defaults to 5ms.

### `parseId(id: bigint): ParsedSnowflakeId`

Parses a Snowflake ID into its components.

**Parameters**:

- `id`: The Snowflake ID to parse

**Returns**: Object with `timestamp`, `machineId`, and `sequence`

### `idToString(id: bigint): string`

Converts a Snowflake ID to a string representation.

### `stringToId(id: string): bigint`

Converts a string back to a Snowflake ID BigInt.

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Error Handling

The generator throws errors in these cases:

- **Invalid Machine ID**: Machine ID must be between 0-1023.
- **Clock Backwards**: System clock moved backwards beyond the `clockSkewTolerance`.
- **Clock catch-up timeout**: Generator waited 1 second for the clock to catch up but it didn't.

## Clock Skew Compensation

Added robust handling for clock drift and backward clock jumps:

- **Wait for catch-up**: If the clock moves backward within the `clockSkewTolerance` (default 5ms), the generator waits for the clock to catch up.
- **Fail-fast**: If the drift is larger than the tolerance, an error is thrown to prevent duplicate IDs.
- **Safety limit**: A 1-second timeout prevents indefinite waits if the clock remains behind.

## Performance

- Generates up to **4,096 IDs per millisecond** per machine
- Supports up to **1,024 machines** in a distributed system
- IDs remain sortable and monotonic

## Custom Epoch

This implementation uses **2026-01-01T00:00:00.000Z** as the custom epoch, providing:

- Smaller IDs compared to Unix epoch
- ~69 years of timestamp capacity (until ~2095)
