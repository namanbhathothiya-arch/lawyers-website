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
import { Trash2, RefreshCw, CalendarX } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
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

export function HolidaysManager() {
  const queryClient = useQueryClient();
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [lawyerFilter, setLawyerFilter] = useState("all");

  // Deletion confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDetails, setDeleteDetails] = useState("");

  // Fetch Lawyers (for dropdown and filter)
  const { data: lawyers } = useQuery({
    queryKey: ["lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("id, name, specialization")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch Holidays
  const {
    data: holidays,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-holidays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyer_holidays")
        .select(
          `
          *,
          lawyer:lawyers (name, specialization)
        `,
        )
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        lawyer: row.lawyer || (row as { doctor?: { name: string; specialization: string } }).doctor,
        lawyer_id: row.lawyer_id || (row as { doctor_id?: string }).doctor_id,
      }));
    },
  });

  // Add Holiday Mutation
  const addHolidayMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lawyer_holidays").insert([
        {
          lawyer_id: selectedLawyerId,
          date: holidayDate,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-holidays"] });
      queryClient.invalidateQueries({ queryKey: ["lawyer-unavailability"] });
      toast.success("Unavailability date added successfully!");
      setHolidayDate("");
    },
    onError: (err: unknown) => {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === "23505") {
        toast.error("This lawyer is already set to be unavailable on this date.");
      } else {
        toast.error(errorObj.message || "Failed to add holiday.");
      }
    },
  });

  // Remove Holiday Mutation
  const removeHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lawyer_holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-holidays"] });
      queryClient.invalidateQueries({ queryKey: ["lawyer-unavailability"] });
      toast.success("Unavailability date removed.");
    },
    onError: (err: unknown) => {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || "Failed to remove unavailability block.");
    },
  });

  function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLawyerId) {
      toast.error("Please select a lawyer.");
      return;
    }
    if (!holidayDate) {
      toast.error("Please select an unavailability date.");
      return;
    }
    addHolidayMutation.mutate();
  }

  // Filter Logic
  const filteredHolidays = holidays?.filter((h) => {
    return lawyerFilter === "all" || h.lawyer_id === lawyerFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ADD HOLIDAY FORM */}
      <Card className="border-border shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-primary" />
            <span>Add Unavailability Block</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddHoliday} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Lawyer</Label>
              <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose lawyer" />
                </SelectTrigger>
                <SelectContent>
                  {lawyers?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Unavailability Date</Label>
              <Input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={addHolidayMutation.isPending}>
              {addHolidayMutation.isPending ? "Adding block..." : "Add Unavailability Block"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* HOLIDAYS LIST */}
      <Card className="border-border shadow-sm lg:col-span-2">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold">Scheduled Unavailability</CardTitle>
          <div className="flex items-center gap-2 self-start">
            <Select value={lawyerFilter} onValueChange={setLawyerFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Lawyers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lawyers</SelectItem>
                {lawyers?.map((doc) => (
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
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading unavailability list...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
              <p className="font-semibold">Error loading unavailability dates</p>
              <p className="text-sm mt-1">{(error as Error)?.message || "Unknown error occurred"}</p>
            </div>
          ) : !filteredHolidays || filteredHolidays.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
              <p className="font-semibold">No unavailability dates scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a lawyer and date on the left to schedule an unavailability block.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow>
                      <TableHead>Lawyer</TableHead>
                      <TableHead>Unavailability Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolidays.map((holiday) => (
                      <TableRow key={holiday.id} className="hover:bg-secondary/25">
                        <TableCell className="py-3.5 font-semibold">
                          {holiday.lawyer?.name || "Unknown Lawyer"}
                          <div className="text-xs text-muted-foreground font-normal">
                            {holiday.lawyer?.specialization}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm font-medium">
                          {format(new Date(holiday.date), "PPP")}
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeleteId(holiday.id);
                              setDeleteDetails(
                                `${holiday.lawyer?.name || "Lawyer"} on ${format(new Date(holiday.date), "PP")}`,
                              );
                            }}
                            disabled={removeHolidayMutation.isPending}
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
            <AlertDialogTitle className="text-lg font-bold">Remove unavailability block?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground/70">
              Are you sure you want to remove the unavailability block for{" "}
              <span className="font-semibold text-foreground">{deleteDetails}</span>? This will make
              their slots available for client bookings on this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/95 text-destructive-foreground"
              onClick={() => {
                if (deleteId) {
                  removeHolidayMutation.mutate(deleteId);
                }
                setDeleteId(null);
              }}
            >
              Remove Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
