import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock, Eye, RefreshCw, Search, User, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  APPOINTMENT_STATUSES,
  filterAppointments,
  getAppointmentTransitionOptions,
  type AppointmentStatus,
  type AppointmentView,
  type UserRole,
} from "@/lib/appointment-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type PaymentStatus = "pending" | "paid" | "refund_pending" | "refunded" | "failed";

type AppointmentRecord = {
  id: string;
  doctor_id: string;
  service_id: string;
  date: string;
  time_slot: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  payment_id?: string | null;
  order_id?: string | null;
  doctor?: {
    name: string;
    specialization: string;
  } | null;
  service?: {
    name: string;
  } | null;
};

type DoctorOption = {
  id: string;
  name: string;
};

type AppointmentsManagerProps = {
  view?: AppointmentView;
  role?: UserRole;
};

const viewCopy: Record<AppointmentView, { title: string; empty: string }> = {
  all: {
    title: "Appointments Log",
    empty: "No appointments found",
  },
  today: {
    title: "Today's Schedule",
    empty: "No appointments scheduled for today",
  },
  upcoming: {
    title: "Upcoming Appointments",
    empty: "No upcoming appointments found",
  },
  search: {
    title: "Search Patients",
    empty: "No matching appointments found",
  },
};

export function AppointmentsManager({ view = "all", role = "admin" }: AppointmentsManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const copy = viewCopy[view];

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as DoctorOption[];
    },
  });

  const {
    data: appointments,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          doctor:doctors (name, specialization),
          service:services (name)
        `,
        )
        .order("date", { ascending: view === "all" ? false : true })
        .order("time_slot", { ascending: true });

      if (error) throw error;
      return (data || []) as AppointmentRecord[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count"] });
      setSelectedAppointment((current) => (current?.id === id ? { ...current, status } : current));
      toast.success("Appointment status updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update appointment status.");
    },
  });

  const filteredAppointments = useMemo(
    () =>
      filterAppointments(appointments || [], {
        view,
        today,
        searchTerm,
        statusFilter,
        doctorFilter,
        dateFilter,
      }),
    [appointments, dateFilter, doctorFilter, searchTerm, statusFilter, today, view],
  );

  function visibleTransitions(status: AppointmentStatus) {
    const options = getAppointmentTransitionOptions(status);
    if (role === "admin") return options;
    return options.filter((option) => option.status !== "booked");
  }

  function updateStatus(id: string, status: AppointmentStatus) {
    statusMutation.mutate({ id, status });
  }

  function getStatusBadge(status: AppointmentStatus) {
    switch (status) {
      case "pending_payment":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-600 border-none">Pending Payment</Badge>
        );
      case "booked":
        return <Badge className="bg-blue-500/15 text-blue-500 border-none">Booked</Badge>;
      case "confirmed":
        return <Badge className="bg-cyan-500/15 text-cyan-600 border-none">Confirmed</Badge>;
      case "checked_in":
        return <Badge className="bg-indigo-500/15 text-indigo-600 border-none">Checked In</Badge>;
      case "completed":
        return <Badge className="bg-green-500/15 text-green-500 border-none">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/15 text-red-500 border-none">Cancelled</Badge>;
      case "no_show":
        return <Badge className="bg-orange-500/15 text-orange-600 border-none">No Show</Badge>;
    }
  }

  function getPaymentBadge(paymentStatus: PaymentStatus) {
    switch (paymentStatus) {
      case "paid":
        return <Badge className="bg-green-500/15 text-green-500 border-none">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/15 text-yellow-500 border-none">Pending</Badge>;
      case "refund_pending":
        return (
          <Badge className="bg-orange-500/15 text-orange-600 border-none">Refund Pending</Badge>
        );
      case "refunded":
        return <Badge className="bg-purple-500/15 text-purple-500 border-none">Refunded</Badge>;
      case "failed":
        return <Badge className="bg-red-500/15 text-red-500 border-none">Failed</Badge>;
    }
  }

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">{copy.title}</CardTitle>
            {view === "today" && (
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), "PPP")} appointment operations.
              </p>
            )}
            {view === "search" && (
              <p className="text-sm text-muted-foreground mt-1">
                Find a patient by name, phone, or email and open their appointment.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 self-start"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {APPOINTMENT_STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors?.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9"
                disabled={view === "today"}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading appointments...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
              <p className="font-semibold">Error loading appointments</p>
              <p className="text-sm mt-1">{error?.message || "Unknown error occurred"}</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
              <p className="font-semibold">{copy.empty}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {view === "search"
                  ? "Try another name, phone number, or email."
                  : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>{view === "today" ? "Time" : "Date & Time"}</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      {role === "admin" && <TableHead>Payment</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appt) => (
                      <TableRow key={appt.id} className="hover:bg-secondary/25">
                        <TableCell className="py-4 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {appt.patient_name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {appt.patient_phone}
                          </div>
                          <div className="text-xs text-muted-foreground">{appt.patient_email}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          {view !== "today" && (
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {format(new Date(appt.date), "PPP")}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3.5 w-3.5" />
                            {appt.time_slot}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold">{appt.doctor?.name || "Unknown Doctor"}</div>
                          <div className="text-xs text-primary">
                            {appt.service?.name || "Unknown Service"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">{getStatusBadge(appt.status)}</TableCell>
                        {role === "admin" && (
                          <TableCell className="py-4">
                            {getPaymentBadge(appt.payment_status)}
                          </TableCell>
                        )}
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAppointment(appt)}
                              className="h-8"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Open
                            </Button>
                            {visibleTransitions(appt.status).map((next) => (
                              <Button
                                key={next.status}
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(appt.id, next.status)}
                                disabled={statusMutation.isPending}
                                className={
                                  next.status === "cancelled"
                                    ? "h-8 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                    : next.status === "no_show"
                                      ? "h-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-200"
                                      : "h-8 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                                }
                              >
                                {next.status === "cancelled" || next.status === "no_show" ? (
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                {next.label}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedAppointment !== null}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      >
        <DialogContent className="max-w-2xl bg-background border border-border">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAppointment.patient_name}</DialogTitle>
                <DialogDescription>
                  Appointment details and receptionist workflow actions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Detail label="Phone" value={selectedAppointment.patient_phone} />
                <Detail label="Email" value={selectedAppointment.patient_email} />
                <Detail
                  label="Doctor"
                  value={selectedAppointment.doctor?.name || "Unknown Doctor"}
                />
                <Detail
                  label="Service"
                  value={selectedAppointment.service?.name || "Unknown Service"}
                />
                <Detail label="Date" value={format(new Date(selectedAppointment.date), "PPP")} />
                <Detail label="Time" value={selectedAppointment.time_slot} />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Status
                  </div>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
                {role === "admin" && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Payment
                    </div>
                    <div className="mt-1">
                      {getPaymentBadge(selectedAppointment.payment_status)}
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2 flex-wrap">
                {visibleTransitions(selectedAppointment.status).map((next) => (
                  <Button
                    key={next.status}
                    variant={next.status === "cancelled" ? "destructive" : "default"}
                    size="sm"
                    onClick={() => updateStatus(selectedAppointment.id, next.status)}
                    disabled={statusMutation.isPending}
                  >
                    {next.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
