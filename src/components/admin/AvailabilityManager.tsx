import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, RefreshCw, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityManager() {
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState("60");
  const [doctorFilter, setDoctorFilter] = useState("all");

  // Deletion confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDetails, setDeleteDetails] = useState("");

  // Fetch Doctors (for dropdown and filter)
  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name, specialization")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch Availability Rules
  const {
    data: availability,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability")
        .select(
          `
          *,
          doctor:doctors (name, specialization)
        `,
        )
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Add Availability Mutation
  const addAvailabilityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("availability").insert([
        {
          doctor_id: selectedDoctorId,
          day_of_week: parseInt(dayOfWeek),
          start_time: startTime + ":00", // Format to HH:MM:SS
          end_time: endTime + ":00",
          slot_duration_minutes: parseInt(slotDuration),
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
      // Invalidate booking client queries too
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] });
      toast.success("Availability block configured successfully!");
      setDayOfWeek("");
    },
    onError: (err: any) => {
      if (err.code === "23505") {
        toast.error(
          "This doctor already has a schedule block defined for this day at this start time.",
        );
      } else {
        toast.error(err.message || "Failed to add availability.");
      }
    },
  });

  // Remove Availability Mutation
  const removeAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] });
      toast.success("Schedule block removed.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove availability.");
    },
  });

  function handleAddAvailability(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error("Please select a doctor.");
      return;
    }
    if (dayOfWeek === "") {
      toast.error("Please select a day of the week.");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Please fill in start and end times.");
      return;
    }
    if (startTime >= endTime) {
      toast.error("Start time must be strictly before end time.");
      return;
    }
    if (!slotDuration || parseInt(slotDuration) <= 0) {
      toast.error("Please enter a valid slot duration in minutes.");
      return;
    }
    addAvailabilityMutation.mutate();
  }

  // Filter Logic
  const filteredAvailability = availability?.filter((a: any) => {
    return doctorFilter === "all" || a.doctor_id === doctorFilter;
  });

  // Format TIME display
  function formatTimeDisplay(timeStr: string) {
    if (!timeStr) return "";
    // Remove seconds if they are present: '09:00:00' -> '09:00'
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayH = hours % 12 === 0 ? 12 : hours % 12;
      return `${String(displayH).padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return timeStr;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* CONFIGURE availability FORM */}
      <Card className="border-border shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Configure Working Hours</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAvailability} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Doctor</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map((doc: any) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <SelectItem key={day} value={String(idx)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Slot Duration (minutes)</Label>
              <Select value={slotDuration} onValueChange={setSlotDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="20">20 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="45">45 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes (1 Hour)</SelectItem>
                  <SelectItem value="120">120 Minutes (2 Hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={addAvailabilityMutation.isPending}
            >
              {addAvailabilityMutation.isPending ? "Adding block..." : "Add Schedule Block"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* availability LIST */}
      <Card className="border-border shadow-sm lg:col-span-2">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold">Weekly Schedules</CardTitle>
          <div className="flex items-center gap-2 self-start">
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors?.map((doc: any) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* LOADING & ERROR STATES */}
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading weekly schedules...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
              <p className="font-semibold">Error loading schedules</p>
              <p className="text-sm mt-1">{error?.message || "Unknown error occurred"}</p>
            </div>
          ) : !filteredAvailability || filteredAvailability.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
              <p className="font-semibold">No schedules configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a doctor and specify working hours on the left.
              </p>
            </div>
          ) : (
            /* TABLE */
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Weekly Shift</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAvailability.map((avail: any) => (
                      <TableRow key={avail.id} className="hover:bg-secondary/25">
                        <TableCell className="py-3.5 font-semibold">
                          {avail.doctor?.name || "Unknown Doctor"}
                          <div className="text-xs text-muted-foreground font-normal">
                            {avail.doctor?.specialization}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm font-medium">
                          <span className="font-bold text-primary mr-1.5">
                            {DAYS_OF_WEEK[avail.day_of_week]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeDisplay(avail.start_time)} –{" "}
                            {formatTimeDisplay(avail.end_time)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm">
                          {avail.slot_duration_minutes} min slots
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeleteId(avail.id);
                              setDeleteDetails(
                                `${avail.doctor?.name || "Doctor"} on ${DAYS_OF_WEEK[avail.day_of_week]}`,
                              );
                            }}
                            disabled={removeAvailabilityMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                          </Button>
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

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Remove schedule block?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to remove the weekly schedule block for{" "}
              <span className="font-semibold text-foreground">{deleteDetails}</span>? This will
              clear their default bookings availability for this day of the week.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/95 text-destructive-foreground"
              onClick={() => {
                if (deleteId) {
                  removeAvailabilityMutation.mutate(deleteId);
                }
                setDeleteId(null);
              }}
            >
              Remove Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
