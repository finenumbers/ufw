import assert from "node:assert/strict";
import test from "node:test";

import {
  identityCreateSchema,
  identityUpdateSchema,
} from "@/lib/validations/identity";

test("identityCreateSchema requires password for PASSWORD auth", () => {
  const result = identityCreateSchema.safeParse({
    name: "Prod",
    username: "root",
    authMethod: "PASSWORD",
  });

  assert.equal(result.success, false);
});

test("identityUpdateSchema allows empty secrets on edit", () => {
  const result = identityUpdateSchema.safeParse({
    name: "Prod",
    username: "root",
    authMethod: "PASSWORD",
  });

  assert.equal(result.success, true);
});

test("identityUpdateSchema allows auth method unchanged without secrets", () => {
  const result = identityUpdateSchema.safeParse({
    name: "Prod",
    username: "root",
    authMethod: "PRIVATE_KEY",
  });

  assert.equal(result.success, true);
});
