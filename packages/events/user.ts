import { AggregateType, BaseEvent, EventType, Id } from "./core.ts";

export interface UserEventPayload {
  id: Id;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserSignedInEvent = BaseEvent<
  AggregateType.USER,
  EventType.USER_SIGNED_IN,
  { user: UserEventPayload }
>;
