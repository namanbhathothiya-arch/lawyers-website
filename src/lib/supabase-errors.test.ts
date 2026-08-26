import { describe, expect, it } from "vitest";
import { isMissingSupabaseTableError, parseLawyerDeleteError } from "@/lib/supabase-errors";

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

describe("parseLawyerDeleteError", () => {
  it("translates foreign key error for appointments_doctor_id_fkey into friendly admin message", () => {
    const error = new Error(
      'Failed to delete lawyer: update or delete on table "lawyers" violates foreign key constraint "appointments_doctor_id_fkey" on table "consultations"',
    );
    const msg = parseLawyerDeleteError(error);
    expect(msg).toContain("This lawyer has historical consultations and cannot be permanently deleted");
    expect(msg).not.toContain("appointments_doctor_id_fkey");
  });

  it("translates consultations foreign key violation into friendly admin message", () => {
    const error = new Error(
      'update or delete on table "lawyers" violates foreign key constraint "consultations_lawyer_id_fkey" on table "consultations"',
    );
    const msg = parseLawyerDeleteError(error);
    expect(msg).toContain("This lawyer has historical consultations and cannot be permanently deleted");
  });

  it("translates generic 23503 foreign key error cleanly", () => {
    const error = new Error("violates foreign key constraint 23503 on table xyz");
    const msg = parseLawyerDeleteError(error);
    expect(msg).toContain("Lawyer could not be deleted because another record still references this lawyer");
  });

  it("handles plain Supabase PostgREST error objects without returning [object Object]", () => {
    const errorObj = {
      message: 'update or delete on table "lawyers" violates foreign key constraint "appointments_doctor_id_fkey" on table "consultations"',
      code: "23503",
      details: "Key (id)=(...) is still referenced from table consultations.",
      hint: null,
    };
    const msg = parseLawyerDeleteError(errorObj);
    expect(msg).not.toContain("[object Object]");
    expect(msg).toContain("This lawyer has historical consultations and cannot be permanently deleted");
  });

  it("never returns [object Object] even for opaque or empty objects", () => {
    const msg = parseLawyerDeleteError({});
    expect(msg).not.toContain("[object Object]");
    expect(msg).toBe("An unexpected database error occurred.");
  });
});

