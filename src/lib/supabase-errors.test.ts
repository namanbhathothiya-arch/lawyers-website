import { describe, expect, it } from "vitest";
import { isMissingSupabaseTableError } from "@/lib/supabase-errors";

describe("isMissingSupabaseTableError", () => {
  it("recognizes PostgREST errors with a public schema-qualified table", () => {
    expect(
      isMissingSupabaseTableError(
        new Error("Could not find the table 'public.testimonials' in the schema cache"),
        "testimonials",
      ),
    ).toBe(true);
  });

  it("does not match unrelated schema-cache errors", () => {
    expect(
      isMissingSupabaseTableError(
        new Error("Could not find the table 'public.faqs' in the schema cache"),
        "testimonials",
      ),
    ).toBe(false);
  });
});
