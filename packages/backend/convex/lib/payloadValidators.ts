import { v } from "convex/values";

const primitivePayloadValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);

const primitiveArrayPayloadValueValidator = v.union(
  v.array(v.string()),
  v.array(v.number()),
  v.array(v.boolean()),
  v.array(v.null()),
);

const flatRecordPayloadValueValidator = v.union(
  v.record(v.string(), v.string()),
  v.record(v.string(), v.number()),
  v.record(v.string(), v.boolean()),
  v.record(v.string(), v.null()),
);

export const jsonPayloadValueValidator = v.union(
  primitivePayloadValueValidator,
  primitiveArrayPayloadValueValidator,
  flatRecordPayloadValueValidator,
  v.object({}),
  v.array(v.object({})),
);

export const jsonPayloadObjectValidator = v.record(
  v.string(),
  jsonPayloadValueValidator,
);
