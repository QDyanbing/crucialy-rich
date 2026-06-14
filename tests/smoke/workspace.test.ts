import { describe, expect, it } from "vitest";

const workspacePackages = [
  "@crucialy-rich/core",
  "@crucialy-rich/react",
  "@crucialy-rich/demo",
];

describe("workspace scaffold", () => {
  it("tracks the expected packages", () => {
    expect(workspacePackages).toHaveLength(3);
    expect(workspacePackages).toContain("@crucialy-rich/core");
    expect(workspacePackages).toContain("@crucialy-rich/react");
  });
});

