export type UserRole = "admin" | "staff";

export type AppointmentStatus =
  | "pending_payment"
  | "booked"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentWorkflowRecord = {
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  status: AppointmentStatus;
  date: string;
  doctor_id?: string;
};

export type AppointmentView = "all" | "today" | "upcoming" | "search";

export const APPOINTMENT_STATUSES: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "booked", label: "Booked" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export function getAppointmentTransitionOptions(
  status: AppointmentStatus,
): Array<{ status: AppointmentStatus; label: string }> {
  switch (status) {
    case "pending_payment":
      return [
        { status: "booked", label: "Mark Paid/Booked" },
        { status: "cancelled", label: "Cancel" },
      ];
    case "booked":
      return [
        { status: "confirmed", label: "Confirm" },
        { status: "checked_in", label: "Check In" },
        { status: "cancelled", label: "Cancel" },
        { status: "no_show", label: "No Show" },
      ];
    case "confirmed":
      return [
        { status: "checked_in", label: "Check In" },
        { status: "cancelled", label: "Cancel" },
        { status: "no_show", label: "No Show" },
      ];
    case "checked_in":
      return [{ status: "completed", label: "Complete" }];
    default:
      return [];
  }
}

export function appointmentMatchesSearch(appointment: AppointmentWorkflowRecord, term: string) {
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return true;

  return (
    appointment.patient_name.toLowerCase().includes(normalizedTerm) ||
    appointment.patient_email.toLowerCase().includes(normalizedTerm) ||
    appointment.patient_phone.toLowerCase().includes(normalizedTerm)
  );
}

export function filterAppointments<TAppointment extends AppointmentWorkflowRecord>(
  appointments: TAppointment[],
  options: {
    view: AppointmentView;
    today: string;
    searchTerm?: string;
    statusFilter?: string;
    doctorFilter?: string;
    dateFilter?: string;
  },
) {
  return appointments.filter((appointment) => {
    const matchesSearch = appointmentMatchesSearch(appointment, options.searchTerm || "");
    const matchesStatus =
      !options.statusFilter ||
      options.statusFilter === "all" ||
      appointment.status === options.statusFilter;
    const matchesDoctor =
      !options.doctorFilter ||
      options.doctorFilter === "all" ||
      appointment.doctor_id === options.doctorFilter;
    const matchesDate = !options.dateFilter || appointment.date === options.dateFilter;
    const matchesView =
      options.view === "today"
        ? appointment.date === options.today
        : options.view === "upcoming"
          ? appointment.date >= options.today &&
            appointment.status !== "completed" &&
            appointment.status !== "cancelled" &&
            appointment.status !== "no_show"
          : true;

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate && matchesView;
  });
}

export function getVisibleAdminTabs(role: UserRole) {
  if (role === "staff") {
    return ["today", "appointments", "search"] as const;
  }

  return ["dashboard", "appointments", "doctors", "services", "availability", "holidays"] as const;
}

export function canManageClinicSettings(role: UserRole) {
  return role === "admin";
}
