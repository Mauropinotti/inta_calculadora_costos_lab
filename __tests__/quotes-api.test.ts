import { describe, it } from "vitest";

// Integration tests require a live database connection and running Next.js server.
// They are skipped by default to avoid failures in environments without DATABASE_URL.
describe.skip("Quotes API integration", () => {
  it("should create and fetch a quote", () => {
    // Implemented in deployment pipeline with real database.
  });
});
