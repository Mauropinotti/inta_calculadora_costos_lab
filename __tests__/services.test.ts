import { describe, it } from "vitest";

// Service tests depend on a provisioned Neon database.
describe.skip("Quote services", () => {
  it("should persist and retrieve quotes", async () => {
    // Implemented downstream with real database credentials.
  });
});
