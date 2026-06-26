import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildUfwAddCommand, UfwRuleValidationError, validateRuleCoreForUfw } from "@/lib/ufw/commands";
import type { RuleCore } from "@/types/rule";

const baseCore: RuleCore = {
  action: "ALLOW",
  direction: "IN",
  interface: "eth0",
  protocol: "TCP",
  fromAddress: "any",
  fromPort: null,
  toAddress: "any",
  toPort: "443",
  appName: null,
  logMode: "NONE",
  ruleComment: null,
  ipv6: false,
};

function buildWith(overrides: Partial<RuleCore>): string {
  return buildUfwAddCommand({ ...baseCore, ...overrides });
}

describe("buildUfwAddCommand injection rejection", () => {
  it("rejects shell metacharacters in interface", () => {
    assert.throws(
      () => buildWith({ interface: "eth0; rm -rf /" }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError &&
        error.message.includes("interface"),
    );
  });

  it("rejects backticks in appName", () => {
    assert.throws(
      () => buildWith({ appName: "`id`", toPort: null }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError &&
        error.message.includes("appName"),
    );
  });

  it("rejects command substitution in ruleComment", () => {
    assert.throws(
      () => buildWith({ ruleComment: "$(whoami)" }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError &&
        error.message.includes("ruleComment"),
    );
  });

  it("rejects newline injection in fromAddress", () => {
    assert.throws(
      () => buildWith({ fromAddress: "1.2.3.4\nrm -rf /" }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError &&
        error.message.includes("fromAddress"),
    );
  });

  it("rejects invalid action enum injection", () => {
    assert.throws(
      () =>
        buildWith({ action: "ALLOW; id" as RuleCore["action"] }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError && error.message.includes("action"),
    );
  });

  it("rejects invalid protocol enum injection", () => {
    assert.throws(
      () =>
        buildWith({ protocol: "TCP; rm -rf /" as RuleCore["protocol"] }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError && error.message.includes("protocol"),
    );
  });

  it("rejects invalid logMode enum injection", () => {
    assert.throws(
      () =>
        buildWith({ logMode: "LOG; id" as RuleCore["logMode"] }),
      (error: unknown) =>
        error instanceof UfwRuleValidationError && error.message.includes("logMode"),
    );
  });

  it("allows safe rule values", () => {
    const command = buildWith({
      fromAddress: "192.168.1.0/24",
      toPort: "8080:8090",
      ruleComment: "Allow HTTPS from LAN",
    });

    assert.match(command, /^ufw allow in on eth0 from 192\.168\.1\.0\/24 to 0\.0\.0\.0\/0 port 8080:8090 proto tcp comment/);
  });
});

describe("validateRuleCoreForUfw port fields", () => {
  it("rejects literal any in To Port", () => {
    const error = validateRuleCoreForUfw({ ...baseCore, toPort: "any" });
    assert.match(error ?? "", /To Port: leave empty for any port/);
  });
});

describe("buildUfwAddCommand protocol ANY", () => {
  it("omits proto any and allows all protocols on the port", () => {
    const command = buildUfwAddCommand({
      ...baseCore,
      protocol: "ANY",
      interface: null,
      toPort: "7373",
    });

    assert.equal(
      command,
      "ufw allow in from 0.0.0.0/0 to 0.0.0.0/0 port 7373",
    );
    assert.doesNotMatch(command, /proto any/);
  });
});
