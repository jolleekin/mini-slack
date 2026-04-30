import { customType } from "drizzle-orm/pg-core";

/**
 * Custom column type for IDs that stores as bigint in the database
 * but returns as string in the application to ensure serialization consistency.
 */
export const idType = customType<{
  data: string;
  driverData: bigint;
}>({
  dataType() {
    return "bigint";
  },
  toDriver(value: string): bigint {
    return BigInt(value);
  },
  fromDriver(value: bigint): string {
    return value.toString();
  },
});
