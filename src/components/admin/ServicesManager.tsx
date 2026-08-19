import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, RefreshCw, Briefcase, ChevronDown } from "lucide-react";
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

interface AdminService {
  id: string;
  name: string;
  description: string | null;
  price: string;
}

export function ServicesManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  // Deletion confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  // Fetch Services
  const {
    data: services,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdminService[]>({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_services")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Open modal for Adding
  function handleAddOpen() {
    setEditingService(null);
    setName("");
    setDescription("");
    setPrice("");
    setIsOpen(true);
  }

  // Open modal for Editing
  function handleEditOpen(svc: AdminService) {
    setEditingService(svc);
    setName(svc.name);
    setDescription(svc.description || "");
    setPrice(svc.price);
    setIsOpen(true);
  }

  // Add/Edit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const svcPayload = {
        name,
        description: description || null,
        price,
      };

      if (editingService) {
        // Update
        const { error } = await supabase
          .from("legal_services")
          .update(svcPayload)
          .eq("id", editingService.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("legal_services").insert([svcPayload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["legal_services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count"] });
      toast.success(
        editingService ? "Service updated successfully!" : "Service added successfully!",
      );
      setIsOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to save service."));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("legal_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count"] });
      toast.success("Service deleted successfully.");
    },
    onError: (err: unknown) => {
      toast.error(
        getErrorMessage(err, "Failed to delete service. Ensure no appointments reference it."),
      );
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Please fill in all required fields (Name, Price)");
      return;
    }
    saveMutation.mutate();
  }

  function toggleDescription(serviceId: string) {
    setExpandedDescriptions((current) => ({
      ...current,
      [serviceId]: !current[serviceId],
    }));
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-xl font-bold">Manage Legal Services</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={handleAddOpen} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Legal Service
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* LOADING & ERROR STATES */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading services list...</p>
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
            <p className="font-semibold">Error loading services</p>
            <p className="text-sm mt-1">{error?.message || "Unknown error occurred"}</p>
          </div>
        ) : !services || services.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
            <p className="font-semibold">No services registered</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Legal Service" to create your first legal service option.
            </p>
          </div>
        ) : (
          /* LIST GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card
                key={s.id}
                className="border-border bg-background hover:shadow-md transition-shadow relative flex min-w-0 flex-col justify-between overflow-hidden"
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <h3 className="flex min-w-0 items-start gap-1.5 break-words text-lg font-semibold [overflow-wrap:anywhere]">
                      <Briefcase className="mt-1 h-4 w-4 shrink-0 text-primary" /> {s.name}
                    </h3>
                    <span className="inline-block max-w-full break-words rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary [overflow-wrap:anywhere]">
                      {s.price}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-border"
                      onClick={() => handleEditOpen(s)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => {
                        setDeleteId(s.id);
                        setDeleteName(s.name);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="min-w-0 flex-1 pt-2">
                  <div className="min-w-0">
                    <p
                      className={`min-w-0 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] ${
                        expandedDescriptions[s.id] ? "" : "max-h-[3.75rem] overflow-hidden"
                      }`}
                    >
                      {s.description || "No description provided."}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-0 text-xs font-bold text-primary hover:bg-transparent hover:text-primary/75"
                      onClick={() => toggleDescription(s.id)}
                      aria-label={`${expandedDescriptions[s.id] ? "Collapse" : "Expand"} description for ${s.name}`}
                    >
                      {expandedDescriptions[s.id] ? "Show less" : "Expand"}
                      <ChevronDown
                        className={`ml-1 h-3.5 w-3.5 transition-transform ${
                          expandedDescriptions[s.id] ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* DIALOG MODAL (ADD / EDIT) */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingService ? "Edit Legal Service" : "Create New Legal Service"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="svc-name">
                  Service name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="svc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. General Consultation"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-price">
                  Pricing Text <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="svc-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. ₹600 or From ₹500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-desc">Description</Label>
                <Textarea
                  id="svc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what is included in this service..."
                  rows={4}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Service"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION ALERT DIALOG */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-background border border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                This will permanently delete the service offering{" "}
                <span className="font-semibold text-foreground">{deleteName}</span>. Clients will
                no longer be able to select it when booking consultations. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/95 text-destructive-foreground"
                onClick={() => {
                  if (deleteId) {
                    deleteMutation.mutate(deleteId);
                  }
                  setDeleteId(null);
                }}
              >
                Delete Service
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
