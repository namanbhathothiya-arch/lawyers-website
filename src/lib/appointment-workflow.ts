export type UserRole = "admin" | "lawyer" | "staff";

export type ConsultationStatus =
  | "pending_payment"
  | "booked"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentStatus = ConsultationStatus;

export type ConsultationWorkflowRecord = {
  client_name: string;
  client_phone: string;
  client_email: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  status: ConsultationStatus;
  date: string;
  lawyer_id?: string;
  doctor_id?: string;
};

export type AppointmentWorkflowRecord = ConsultationWorkflowRecord;

export type ConsultationView = "all" | "today" | "upcoming" | "search";
export type AppointmentView = ConsultationView;

export const CONSULTATION_STATUSES: Array<{ value: ConsultationStatus; label: string }> = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "booked", label: "Booked" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const APPOINTMENT_STATUSES = CONSULTATION_STATUSES;

export function getConsultationTransitionOptions(
  status: ConsultationStatus,
): Array<{ status: ConsultationStatus; label: string }> {
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

export const getAppointmentTransitionOptions = getConsultationTransitionOptions;

export function consultationMatchesSearch(consultation: ConsultationWorkflowRecord, term: string) {
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return true;

  const clientName = consultation.client_name || consultation.patient_name || "";
  const clientEmail = consultation.client_email || consultation.patient_email || "";
  const clientPhone = consultation.client_phone || consultation.patient_phone || "";

  return (
    clientName.toLowerCase().includes(normalizedTerm) ||
    clientEmail.toLowerCase().includes(normalizedTerm) ||
    clientPhone.toLowerCase().includes(normalizedTerm)
  );
}

export const appointmentMatchesSearch = consultationMatchesSearch;

export function filterConsultations<TConsultation extends ConsultationWorkflowRecord>(
  consultations: TConsultation[],
  options: {
    view: ConsultationView;
    today: string;
    searchTerm?: string;
    statusFilter?: string;
    lawyerFilter?: string;
    doctorFilter?: string;
    dateFilter?: string;
  },
) {
  const targetLawyerFilter = options.lawyerFilter || options.doctorFilter;
  return consultations.filter((consultation) => {
    const matchesSearch = consultationMatchesSearch(consultation, options.searchTerm || "");
    const matchesStatus =
      !options.statusFilter ||
      options.statusFilter === "all" ||
      consultation.status === options.statusFilter;
    const targetLawyer = consultation.lawyer_id || consultation.doctor_id;
    const matchesLawyer =
      !targetLawyerFilter ||
      targetLawyerFilter === "all" ||
      targetLawyer === targetLawyerFilter;
    const matchesDate = !options.dateFilter || consultation.date === options.dateFilter;
    const matchesView =
      options.view === "today"
        ? consultation.date === options.today
        : options.view === "upcoming"
          ? consultation.date >= options.today &&
            consultation.status !== "completed" &&
            consultation.status !== "cancelled" &&
            consultation.status !== "no_show"
          : true;

    return matchesSearch && matchesStatus && matchesLawyer && matchesDate && matchesView;
  });
}

export const filterAppointments = filterConsultations;

export function getVisibleAdminTabs(role: UserRole) {
  if (role === "staff") {
    return ["today", "appointments", "consultations", "search"] as const;
  }

  return [
    "dashboard",
    "appointments",
    "consultations",
    "lawyers",
    "doctors",
    "services",
    "availability",
    "holidays",
  ] as const;
}

export function canManageFirmSettings(role: UserRole) {
  return role === "admin";
}

export const canManageClinicSettings = canManageFirmSettings;
