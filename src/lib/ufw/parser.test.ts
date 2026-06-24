import assert from "node:assert/strict";
import test from "node:test";

import { buildUfwAddCommand } from "@/lib/ufw/commands";
import { parseUfwStatusAndRules } from "@/lib/ufw/parser";
import type { RuleCore } from "@/types/rule";

const USER_SERVER_STATUS = `Status: active

To                         Action      From
--                         ------      ----
Anywhere                   ALLOW       10.200.0.0/16
Anywhere                   ALLOW       95.163.183.223
Anywhere                   ALLOW       90.189.221.79
Anywhere                   ALLOW       90.189.217.68
Anywhere                   ALLOW       38.180.15.87
Anywhere                   ALLOW       5.227.161.160/27
38484                      ALLOW       Anywhere
`;

const NUMBERED_STATUS = `Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] Nginx Full                 ALLOW IN    Anywhere
[ 3] Anywhere on eth0           ALLOW IN    203.0.113.102
[ 4] 22/tcp (v6)                ALLOW IN    Anywhere (v6)
[ 5] 22/tcp                     ALLOW LOG IN Anywhere
[ 6] 22/tcp                     ALLOW LOG-ALL IN Anywhere
[ 7] 10.0.0.0/8                 ALLOW OUT   Anywhere on eth1
[ 8] 192.168.0.1                ALLOW IN    Anywhere
[ 9] Anywhere                   LIMIT IN    Anywhere                   # SSH rate limit
`;

const VERBOSE_STATUS = `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
80,443/tcp (Nginx Full)    ALLOW IN    Anywhere
22/tcp (OpenSSH)           ALLOW IN    Anywhere
22:tcp                     ALLOW IN    192.168.0.0/24
`;

const ROUTE_STATUS = `Status: active

To                         Action      From
--                         ------      ----
10.0.0.0/8 on eth1         ALLOW FWD   192.168.0.0/16 on eth0
`;

function findRule(
  rules: ReturnType<typeof parseUfwStatusAndRules>["rules"],
  predicate: (core: RuleCore) => boolean,
) {
  return rules.find((rule) => predicate(rule.core));
}

test("parseUfwStatusAndRules maps bare port in To column to toPort", () => {
  const { rules } = parseUfwStatusAndRules(USER_SERVER_STATUS);
  const portRule = findRule(rules, (core) => core.toPort === "38484");

  assert.ok(portRule);
  assert.equal(portRule.core.appName, null);
  assert.equal(portRule.core.fromAddress, "any");
  assert.equal(portRule.core.toAddress, "any");
  assert.equal(portRule.core.direction, "IN");
});

test("parseUfwStatusAndRules maps source CIDR and host rules from From column", () => {
  const { rules } = parseUfwStatusAndRules(USER_SERVER_STATUS);

  assert.ok(findRule(rules, (core) => core.fromAddress === "10.200.0.0/16"));
  assert.ok(findRule(rules, (core) => core.fromAddress === "95.163.183.223"));
  assert.ok(findRule(rules, (core) => core.fromAddress === "5.227.161.160/27"));
  assert.equal(rules.length, 7);
});

test("parseUfwStatusAndRules parses numbered multi-word app profiles", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const appRule = findRule(rules, (core) => core.appName === "Nginx Full");

  assert.ok(appRule);
  assert.equal(appRule.ruleNumber, 2);
  assert.equal(appRule.core.action, "ALLOW");
  assert.equal(appRule.core.fromAddress, "any");
});

test("parseUfwStatusAndRules parses interface on To column", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.fromAddress === "203.0.113.102");

  assert.ok(rule);
  assert.equal(rule.core.interface, "eth0");
  assert.equal(rule.core.toAddress, "any");
});

test("parseUfwStatusAndRules parses interface on From column for OUT rules", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.toAddress === "10.0.0.0/8");

  assert.ok(rule);
  assert.equal(rule.core.direction, "OUT");
  assert.equal(rule.core.interface, "eth1");
  assert.equal(rule.core.fromAddress, "any");
});

test("parseUfwStatusAndRules parses IPv6 flag and LOG modes", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);

  const v6Rule = findRule(rules, (core) => core.ipv6 && core.toPort === "22");
  assert.ok(v6Rule);

  const logRule = findRule(
    rules,
    (core) => core.logMode === "LOG" && core.toPort === "22" && !core.ipv6,
  );
  assert.ok(logRule);

  const logAllRule = findRule(rules, (core) => core.logMode === "LOG_ALL");
  assert.ok(logAllRule);
});

test("parseUfwStatusAndRules maps destination IP in To column", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.toAddress === "192.168.0.1");

  assert.ok(rule);
  assert.equal(rule.core.appName, null);
  assert.equal(rule.core.fromAddress, "any");
});

test("parseUfwStatusAndRules extracts rule comments", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.action === "LIMIT");

  assert.ok(rule);
  assert.equal(rule.core.ruleComment, "SSH rate limit");
});

test("parseUfwStatusAndRules parses verbose port/proto with app annotation", () => {
  const { rules } = parseUfwStatusAndRules(VERBOSE_STATUS);
  const rule = findRule(rules, (core) => core.toPort === "80,443");

  assert.ok(rule);
  assert.equal(rule.core.protocol, "TCP");
  assert.equal(rule.core.appName, "Nginx Full");
});

test("parseUfwStatusAndRules parses verbose OpenSSH annotation", () => {
  const { rules } = parseUfwStatusAndRules(VERBOSE_STATUS);
  const rule = findRule(rules, (core) => core.appName === "OpenSSH");

  assert.ok(rule);
  assert.equal(rule.core.toPort, "22");
  assert.equal(rule.core.protocol, "TCP");
});

test("parseUfwStatusAndRules parses legacy colon port/protocol syntax", () => {
  const { rules } = parseUfwStatusAndRules(VERBOSE_STATUS);
  const rule = findRule(rules, (core) => core.fromAddress === "192.168.0.0/24");

  assert.ok(rule);
  assert.equal(rule.core.toPort, "22");
  assert.equal(rule.core.protocol, "TCP");
});

test("parseUfwStatusAndRules maps route/FWD rules to ROUTE direction", () => {
  const { rules } = parseUfwStatusAndRules(ROUTE_STATUS);
  const rule = rules[0];

  assert.ok(rule);
  assert.equal(rule.core.direction, "ROUTE");
  assert.equal(rule.core.toAddress, "10.0.0.0/8");
  assert.equal(rule.core.fromAddress, "192.168.0.0/16");
  assert.equal(rule.core.interface, "eth0");
});

test("buildUfwAddCommand round-trips parsed inbound port rule", () => {
  const { rules } = parseUfwStatusAndRules(USER_SERVER_STATUS);
  const rule = findRule(rules, (core) => core.toPort === "38484");

  assert.ok(rule);
  const command = buildUfwAddCommand(rule.core);
  assert.match(command, /^ufw allow in from 0\.0\.0\.0\/0 to 0\.0\.0\.0\/0 port 38484$/);
});

test("buildUfwAddCommand round-trips parsed source-restricted rule", () => {
  const { rules } = parseUfwStatusAndRules(USER_SERVER_STATUS);
  const rule = findRule(rules, (core) => core.fromAddress === "10.200.0.0/16");

  assert.ok(rule);
  const command = buildUfwAddCommand(rule.core);
  assert.match(
    command,
    /^ufw allow in from 10\.200\.0\.0\/16 to 0\.0\.0\.0\/0$/,
  );
});

test("buildUfwAddCommand round-trips interface IN rule", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.fromAddress === "203.0.113.102");

  assert.ok(rule);
  const command = buildUfwAddCommand(rule.core);
  assert.match(
    command,
    /^ufw allow in on eth0 from 203\.0\.113\.102 to 0\.0\.0\.0\/0$/,
  );
});

test("buildUfwAddCommand round-trips multiport verbose rule", () => {
  const { rules } = parseUfwStatusAndRules(VERBOSE_STATUS);
  const rule = findRule(rules, (core) => core.toPort === "80,443");

  assert.ok(rule);
  const command = buildUfwAddCommand(rule.core);
  assert.match(
    command,
    /^ufw allow in from 0\.0\.0\.0\/0 to 0\.0\.0\.0\/0 port 80,443 proto tcp$/,
  );
});

test("buildUfwAddCommand round-trips LOG rule", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.logMode === "LOG");

  assert.ok(rule);
  const command = buildUfwAddCommand(rule.core);
  assert.match(
    command,
    /^ufw allow log in from 0\.0\.0\.0\/0 to 0\.0\.0\.0\/0 port 22 proto tcp$/,
  );
});

test("buildUfwAddCommand round-trips app profile rule", () => {
  const { rules } = parseUfwStatusAndRules(NUMBERED_STATUS);
  const rule = findRule(rules, (core) => core.appName === "Nginx Full");

  assert.ok(rule);
  const command = buildUfwAddCommand(rule.core);
  assert.match(command, /^ufw allow in from 0\.0\.0\.0\/0 to 0\.0\.0\.0\/0 app "Nginx Full"$/);
});
