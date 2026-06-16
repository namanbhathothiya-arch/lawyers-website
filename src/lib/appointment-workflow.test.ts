import { describe, expect, it } from "vitest";

import {
  appointmentMatchesSearch,
  canManageClinicSettings,
  filterAppointments,
  getAppointmentTransitionOptions,
  getVisibleAdminTabs,
  type AppointmentWorkflowRecord,
} from "./appointment-workflow";

const appointments: AppointmentWorkflowRecord[] = [
  {
    patient_name: "Priya Shah",
    patient_phone: "+919876543210",
    patient_email: "priya@example.com",
    status: "booked",
    date: "2026-06-12",
    doctor_id: "doctor-1",
  },
  {
    patient_name: "Rohan Iyer",
    patient_phone: "+919800000000",
    patient_email: "rohan@example.com",
    status: "completed",
    date: "2026-06-13",
    doctor_id: "doctor-2",
  },
];

describe("appointment workflow", () => {
  it("allows admin clinic settings and restricts staff clinic settings", () => {
    expect(canManageClinicSettings("admin")).toBe(true);
    expect(canManageClinicSettings("staff")).toBe(false);
    expect(getVisibleAdminTabs("staff")).toEqual(["today", "appointments", "search"]);
    expect(getVisibleAdminTabs("admin")).toContain("doctors");
    expect(getVisibleAdminTabs("admin")).toContain("services");
    expect(getVisibleAdminTabs("staff")).not.toContain("doctors");
    expect(getVisibleAdminTabs("staff")).not.toContain("services");
    expect(getVisibleAdminTabs("staff")).not.toContain("availability");
    expect(getVisibleAdminTabs("staff")).not.toContain("holidays");
  });

  it("returns standard status transitions for receptionist workflow", () => {
    expect(getAppointmentTransitionOptions("booked").map((option) => option.status)).toEqual([
      "confirmed",
      "checked_in",
      "cancelled",
      "no_show",
    ]);
    expect(getAppointmentTransitionOptions("checked_in")).toEqual([
      { status: "completed", label: "Complete" },
    ]);
    expect(getAppointmentTransitionOptions("completed")).toEqual([]);
  });

  it("matches appointment searches by patient name, phone, and email", () => {
    expect(appointmentMatchesSearch(appointments[0], "priya")).toBe(true);
    expect(appointmentMatchesSearch(appointments[0], "98765")).toBe(true);
    expect(appointmentMatchesSearch(appointments[0], "example.com")).toBe(true);
    expect(appointmentMatchesSearch(appointments[0], "missing")).toBe(false);
  });

  it("filters today's appointments", () => {
    expect(filterAppointments(appointments, { view: "today", today: "2026-06-12" })).toEqual([
      appointments[0],
    ]);
  });

  it("filters upcoming active appointments", () => {
    expect(filterAppointments(appointments, { view: "upcoming", today: "2026-06-12" })).toEqual([
      appointments[0],
    ]);
  });
});
