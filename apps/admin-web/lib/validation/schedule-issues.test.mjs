import assert from "node:assert/strict";
import test from "node:test";

import { blocksPublish, blocksSave, scheduleIssues } from "./schedule-issues.js";

const clean = {
  weekdays: [1, 2, 3, 4, 5],
  starts_at: "06:00",
  ends_at: "16:00",
  amount: 40000,
};

test("a valid window has no issues", () => {
  assert.deepEqual(scheduleIssues([clean]), [[]]);
});

test("different prices on the same weekday block save", () => {
  const issues = scheduleIssues([
    clean,
    { weekdays: [1], starts_at: "12:00", ends_at: "18:00", amount: 60000 },
  ]);
  assert.ok(issues[0].includes("conflict"));
  assert.ok(issues[1].includes("conflict"));
  assert.equal(blocksSave(issues[0]), true);
  assert.equal(blocksPublish(issues[0]), true);
});

test("the same price on an overlapping window blocks publish only", () => {
  const issues = scheduleIssues([
    clean,
    { weekdays: [1], starts_at: "12:00", ends_at: "18:00", amount: 40000 },
  ]);
  assert.ok(issues[0].includes("overlap"));
  assert.equal(blocksSave(issues[0]), false);
  assert.equal(blocksPublish(issues[0]), true);
});

test("an exact copy is a duplicate", () => {
  const issues = scheduleIssues([clean, { ...clean }]);
  assert.ok(issues[0].includes("duplicate"));
  assert.ok(issues[1].includes("duplicate"));
  assert.equal(blocksSave(issues[0]), false);
});

test("a reversed clock and an empty weekday are save errors", () => {
  const issues = scheduleIssues([
    { weekdays: [], starts_at: "18:00", ends_at: "08:00", amount: Number.NaN },
  ]);
  assert.deepEqual(issues[0], ["weekdays", "order", "amount"]);
  assert.equal(blocksSave(issues[0]), true);
});

test("touching endpoints do not overlap", () => {
  const issues = scheduleIssues([
    clean,
    { weekdays: [1], starts_at: "16:00", ends_at: "22:00", amount: 60000 },
  ]);
  assert.deepEqual(issues, [[], []]);
});
