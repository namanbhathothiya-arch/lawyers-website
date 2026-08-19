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
    client_name: "Priya Shah",
    client_phone: "+919876543210",
    client_email: "priya@example.com",
    status: "booked",
    date: "2026-06-12",
    lawyer_id: "lawyer-1",
  },
  {
    client_name: "Rohan Iyer",
    client_phone: "+919800000000",
    client_email: "rohan@example.com",
    status: "completed",
    date: "2026-06-13",
    lawyer_id: "lawyer-2",
  },
];

describe("consultation workflow", () => {
  it("allows admin firm settings and restricts staff firm settings", () => {
    expect(canManageClinicSettings("admin")).toBe(true);
    expect(canManageClinicSettings("staff")).toBe(false);
    expect(getVisibleAdminTabs("staff")).toContain("today");
    expect(getVisibleAdminTabs("admin")).toContain("lawyers");
    expect(getVisibleAdminTabs("admin")).toContain("services");
    expect(getVisibleAdminTabs("staff")).not.toContain("lawyers");
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

  it("matches consultation searches by client name, phone, and email", () => {
    expect(appointmentMatchesSearch(appointments[0], "priya")).toBe(true);
    expect(appointmentMatchesSearch(appointments[0], "98765")).toBe(true);
    expect(appointmentMatchesSearch(appointments[0], "example.com")).toBe(true);
    expect(appointmentMatchesSearch(appointments[0], "missing")).toBe(false);
  });

  it("filters today's consultations", () => {
    expect(filterAppointments(appointments, { view: "today", today: "2026-06-12" })).toEqual([
      appointments[0],
    ]);
  });

  it("filters upcoming active consultations", () => {
    expect(filterAppointments(appointments, { view: "upcoming", today: "2026-06-12" })).toEqual([
      appointments[0],
    ]);
  });
});
