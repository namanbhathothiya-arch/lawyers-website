import { describe, expect, it } from "vitest";

import {
  canBookDoctorForService,
  generateSlotsFromAvailability,
  getDoctorsForService,
  getAmountInPaise,
  isValidIndianPhone,
  normalizeIndianPhone,
  resetDoctorSelectionForServiceChange,
} from "./booking-utils";

describe("booking utilities", () => {
  it("validates Indian mobile numbers", () => {
    expect(isValidIndianPhone("+91 98765 43210")).toBe(true);
    expect(isValidIndianPhone("09876543210")).toBe(true);
    expect(isValidIndianPhone("5876543210")).toBe(false);
    expect(isValidIndianPhone("98765")).toBe(false);
  });

  it("normalizes phone number separators", () => {
    expect(normalizeIndianPhone("+91 (98765) 43210")).toBe("+919876543210");
  });

  it("converts display prices to paise", () => {
    expect(getAmountInPaise("₹2,200")).toBe(220000);
    expect(getAmountInPaise("From ₹500")).toBe(50000);
    expect(getAmountInPaise("Call clinic")).toBe(50000);
  });

  it("generates appointment slots from availability", () => {
    expect(generateSlotsFromAvailability("09:00:00", "10:30:00", 30)).toEqual([
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
    ]);
  });

  it("returns only mapped doctors for a mapped service", () => {
    const doctors = [{ id: "doctor-1" }, { id: "doctor-2" }, { id: "doctor-3" }];

    expect(getDoctorsForService(doctors, ["doctor-1", "doctor-3"])).toEqual([
      { id: "doctor-1" },
      { id: "doctor-3" },
    ]);
  });

  it("falls back to all doctors when a service has no mappings", () => {
    const doctors = [{ id: "doctor-1" }, { id: "doctor-2" }];

    expect(getDoctorsForService(doctors, [])).toEqual(doctors);
    expect(getDoctorsForService(doctors, undefined)).toEqual(doctors);
  });

  it("resets doctor and slot when the service changes", () => {
    expect(resetDoctorSelectionForServiceChange()).toEqual({
      doctor: "",
      slot: "",
    });
  });

  it("rejects invalid doctor and service combinations when mappings exist", () => {
    expect(canBookDoctorForService("doctor-1", "service-1", ["doctor-1"])).toBe(true);
    expect(canBookDoctorForService("doctor-2", "service-1", ["doctor-1"])).toBe(false);
    expect(canBookDoctorForService("doctor-2", "service-1", [])).toBe(true);
    expect(canBookDoctorForService("", "service-1", ["doctor-1"])).toBe(false);
  });
});
