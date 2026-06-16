import { describe, expect, it } from "vitest";

import { getDoctorServiceSyncChanges, uniqueServiceIds } from "./doctor-service-utils";

describe("doctor service assignment utilities", () => {
  it("deduplicates selected service ids before saving mappings", () => {
    expect(uniqueServiceIds(["svc-1", "svc-1", "", "svc-2"])).toEqual(["svc-1", "svc-2"]);
  });

  it("calculates rows to create when assigning services to a new doctor", () => {
    expect(getDoctorServiceSyncChanges([], ["svc-1", "svc-2"])).toEqual({
      add: ["svc-1", "svc-2"],
      remove: [],
    });
  });

  it("calculates rows to add and remove when editing doctor services", () => {
    expect(getDoctorServiceSyncChanges(["svc-1", "svc-2"], ["svc-2", "svc-3"])).toEqual({
      add: ["svc-3"],
      remove: ["svc-1"],
    });
  });

  it("calculates rows to remove when all doctor services are unchecked", () => {
    expect(getDoctorServiceSyncChanges(["svc-1", "svc-2"], [])).toEqual({
      add: [],
      remove: ["svc-1", "svc-2"],
    });
  });
});
