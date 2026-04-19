import { expect, test } from "@playwright/test";

test.describe("scaffolding smoke", () => {
  test("playwright wiring works", () => {
    expect(1 + 1).toBe(2);
  });
});
