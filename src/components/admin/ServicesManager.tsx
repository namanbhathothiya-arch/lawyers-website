import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Briefcase,
  ChevronDown,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { slugifyServiceName, getServicePathSlug } from "@/lib/service-slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type ServiceSectionOption = {
  id: string;
  name: string;
  slug?: string | null;
};

type LawyerServiceCount = {
  service_id: string;
};

type ConsultationServiceCount = {
  service_id: string;
};

type AdminService = {
  id: string;
  section_id: string | null;
  name: string;
  slug?: string | null;
  description: string | null;
  short_description: string | null;
  how_we_help: string | null;
  important_information: string | null;
  price: string;
  display_order: number;
  is_published: boolean;
  archived_at: string | null;
  section?: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
};

type ServicesManagerProps = {
  sectionId?: string;
  sectionName?: string;
};

type ServiceFormState = {
  section_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  how_we_help: string;
  important_information: string;
  price: string;
  display_order: number;
  is_published: boolean;
};

const EMPTY_FORM: ServiceFormState = {
  section_id: "",
  name: "",
  slug: "",
  short_description: "",
  description: "",
  how_we_help: "",
  important_information: "",
  price: "",
  display_order: 0,
  is_published: true,
};

export function ServicesManager({ sectionId, sectionName }: ServicesManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminService | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminService | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");

  const { data: sections } = useQuery<ServiceSectionOption[]>({
    queryKey: ["admin-service-sections", "options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sections")
        .select("id, name, slug")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as ServiceSectionOption[];
    },
  });

  const { data: allServicesForSlugs } = useQuery<{ id: string; name: string; slug?: string | null }[]>({
    queryKey: ["admin-services", "slug-source"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legal_services").select("id, name, slug");
      if (error) throw error;
      return (data || []) as { id: string; name: string; slug?: string | null }[];
    },
  });

  const { data: services, isLoading, isError, error, refetch } = useQuery<AdminService[]>({
    queryKey: ["admin-services", sectionId || "all", selectedSectionFilter],
    queryFn: async () => {
      let query = supabase
        .from("legal_services")
        .select("*, section:service_sections (id, name, slug)")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (sectionId) {
        query = query.eq("section_id", sectionId);
      } else if (selectedSectionFilter !== "all") {
        query = query.eq("section_id", selectedSectionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminService[];
    },
  });

  const { data: lawyerMappings } = useQuery<LawyerServiceCount[]>({
    queryKey: ["admin-service-lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lawyer_services").select("service_id");
      if (error) throw error;
      return (data || []) as LawyerServiceCount[];
    },
  });

  const { data: consultationMappings } = useQuery<ConsultationServiceCount[]>({
    queryKey: ["admin-service-consultations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consultations").select("service_id");
      if (error) throw error;
      return (data || []) as ConsultationServiceCount[];
    },
  });

  const countsByServiceId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of lawyerMappings || []) {
      counts.set(row.service_id, (counts.get(row.service_id) || 0) + 1);
    }
    return counts;
  }, [lawyerMappings]);

  const consultationCountsByServiceId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of consultationMappings || []) {
      counts.set(row.service_id, (counts.get(row.service_id) || 0) + 1);
    }
    return counts;
  }, [consultationMappings]);

  const servicesInView = services || [];

  function resetForm() {
    setEditingService(null);
    setForm({
      ...EMPTY_FORM,
      section_id: sectionId || "",
      display_order: servicesInView.length,
      is_published: true,
    });
    setIsOpen(false);
  }

  function openAdd() {
    setEditingService(null);
    setForm({
      ...EMPTY_FORM,
      section_id: sectionId || sections?.[0]?.id || "",
      display_order: servicesInView.length,
      is_published: true,
    });
    setIsOpen(true);
  }

  function openEdit(service: AdminService) {
    setEditingService(service);
    setForm({
      section_id: service.section_id || sectionId || "",
      name: service.name,
      slug: service.slug || "",
      short_description: service.short_description || "",
      description: service.description || "",
      how_we_help: service.how_we_help || "",
      important_information: service.important_information || "",
      price: service.price || "",
      display_order: service.display_order ?? 0,
      is_published: service.is_published ?? true,
    });
    setIsOpen(true);
  }

  function buildPayload() {
    const currentId = editingService?.id || crypto.randomUUID();
    const candidate = {
      id: currentId,
      name: form.name.trim(),
      slug: form.slug.trim(),
    };
    const uniqueSlug = getServicePathSlug(
      candidate,
      allServicesForSlugs || [],
      sections || [],
    );

    return {
      id: currentId,
      section_id: sectionId || form.section_id || null,
      name: form.name.trim(),
      slug: uniqueSlug || slugifyServiceName(form.name),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      how_we_help: form.how_we_help.trim() || null,
      important_information: form.important_information.trim() || null,
      price: form.price.trim(),
      display_order: Number(form.display_order) || 0,
      is_published: form.is_published,
      archived_at: null,
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetSectionId = sectionId || form.section_id;
      if (!targetSectionId) {
        throw new Error("Please select a Service Section for this service before saving.");
      }
      const payload = buildPayload();

      if (editingService) {
        const { error } = await supabase
          .from("legal_services")
          .update({
            section_id: payload.section_id,
            name: payload.name,
            slug: payload.slug,
            short_description: payload.short_description,
            description: payload.description,
            how_we_help: payload.how_we_help,
            important_information: payload.important_information,
            price: payload.price,
            display_order: payload.display_order,
            is_published: payload.is_published,
            archived_at: payload.archived_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("legal_services").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["legal_services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "legal_services"] });
      toast.success(editingService ? "Service updated successfully." : "Service added successfully.");
      setIsOpen(false);
      setEditingService(null);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to save service."));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (service: AdminService) => {
      const { error } = await supabase
        .from("legal_services")
        .update({
          is_published: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["legal_services"] });
      toast.success("Service archived.");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to archive service."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (service: AdminService) => {
      const { error } = await supabase.from("legal_services").delete().eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["legal_services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "legal_services"] });
      toast.success("Service deleted.");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to delete service."));
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.price.trim()) {
      toast.error("Service name and price are required.");
      return;
    }

    if (!sectionId && !form.section_id) {
      toast.error("Please select a service section.");
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

  const title = sectionName ? `${sectionName} services` : "Manage Services";
  const subtitle = sectionName
    ? "Add, edit, publish, or archive the specific services in this section."
    : "Manage the specific services that sit under each service section.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!sectionId && (
            <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections?.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openAdd} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading services...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-destructive/20 bg-destructive/5 py-16 text-center text-destructive">
          <p className="font-semibold">Could not load services</p>
          <p className="mt-1 text-sm">{error?.message}</p>
        </div>
      ) : servicesInView.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/10 py-20 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-semibold">No services yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the first specific service inside this section.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {servicesInView.map((service) => {
            const lawyerCount = countsByServiceId.get(service.id) || 0;
            const consultationCount = consultationCountsByServiceId.get(service.id) || 0;
            const isArchived = Boolean(service.archived_at);
            const hasDependencies = lawyerCount > 0 || consultationCount > 0;
            const sectionLabel = service.section?.name || sections?.find((section) => section.id === service.section_id)?.name || "Unassigned";

            return (
              <Card
                key={service.id}
                className="relative flex min-w-0 flex-col overflow-hidden border-border bg-background shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="min-w-0 break-words text-lg [overflow-wrap:anywhere]">
                        {service.name}
                      </CardTitle>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        {sectionLabel}
                      </p>
                      {service.price && (
                        <span className="inline-block max-w-full break-words rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary [overflow-wrap:anywhere]">
                          {service.price}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => openEdit(service)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setArchiveTarget(service)}
                        disabled={isArchived}
                        title={isArchived ? "Already archived" : "Archive service"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(service)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="min-w-0 flex-1 pt-2">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={isArchived ? "rounded-full bg-muted px-2.5 py-1 font-bold uppercase tracking-wide text-muted-foreground" : "rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold uppercase tracking-wide text-emerald-600"}>
                        {isArchived ? "Archived" : service.is_published ? "Published" : "Hidden"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold uppercase tracking-wide text-slate-600">
                        Lawyers: {lawyerCount}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold uppercase tracking-wide text-slate-600">
                        Consultations: {consultationCount}
                      </span>
                    </div>

                    <p
                      className={`min-w-0 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] ${
                        expandedDescriptions[service.id] ? "" : "max-h-[4.5rem] overflow-hidden"
                      }`}
                    >
                      {service.short_description || service.description || "No description provided."}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-0 text-xs font-bold text-primary hover:bg-transparent hover:text-primary/75"
                      onClick={() => toggleDescription(service.id)}
                    >
                      {expandedDescriptions[service.id] ? "Show less" : "Expand"}
                      <ChevronDown
                        className={`ml-1 h-3.5 w-3.5 transition-transform ${
                          expandedDescriptions[service.id] ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </Button>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Published
                      </label>
                      <Switch
                        checked={service.is_published}
                        onCheckedChange={(checked) =>
                          supabase
                            .from("legal_services")
                            .update({
                              is_published: checked,
                              updated_at: new Date().toISOString(),
                            })
                            .eq("id", service.id)
                            .then(({ error }) => {
                              if (error) {
                                toast.error(error.message);
                                return;
                              }
                              queryClient.invalidateQueries({ queryKey: ["admin-services"] });
                              queryClient.invalidateQueries({ queryKey: ["legal_services"] });
                            })
                        }
                      />
                    </div>

                    {hasDependencies && (
                      <p className="text-xs leading-relaxed text-amber-700">
                        This service is linked to {lawyerCount} lawyer assignment(s) and {consultationCount} consultation(s). Archive it instead of deleting unless those records are removed first.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {sectionId ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
                <span className="font-semibold">Service section:</span> {sectionName || "Bound to current section"}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="svc-section">
                  Service section <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.section_id}
                  onValueChange={(value) => setForm((current) => ({ ...current, section_id: value }))}
                >
                  <SelectTrigger id="svc-section">
                    <SelectValue placeholder="Choose section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections?.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="svc-name">
                  Service name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="svc-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                      slug: current.slug || slugifyServiceName(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-slug">Slug</Label>
                <Input
                  id="svc-slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="auto-generated from name if blank"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-price">
                  Pricing text <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="svc-price"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="e.g. ₹600 or From ₹500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-order">Display order</Label>
                <Input
                  id="svc-order"
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, display_order: Number(event.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-short">Short description</Label>
              <Textarea
                id="svc-short"
                value={form.short_description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, short_description: event.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-desc">Full description</Label>
              <Textarea
                id="svc-desc"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-help">How we help</Label>
              <Textarea
                id="svc-help"
                value={form.how_we_help}
                onChange={(event) =>
                  setForm((current) => ({ ...current, how_we_help: event.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-terms">Important information / terms</Label>
              <Textarea
                id="svc-terms"
                value={form.important_information}
                onChange={(event) =>
                  setForm((current) => ({ ...current, important_information: event.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <Label htmlFor="svc-published">Published</Label>
                <p className="text-xs text-muted-foreground">Show this service to the public.</p>
              </div>
              <Switch
                id="svc-published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, is_published: checked }))}
              />
            </div>

            <DialogFooter className="border-t border-border pt-4">
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

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Delete this service?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground/70">
              {deleteTarget &&
                (() => {
                  const lawyerCount = countsByServiceId.get(deleteTarget.id) || 0;
                  const consultationCount = consultationCountsByServiceId.get(deleteTarget.id) || 0;
                  if (lawyerCount > 0 || consultationCount > 0) {
                    return `This service still has ${lawyerCount} lawyer assignment(s) and ${consultationCount} consultation(s). Archive it instead or remove the dependent records first.`;
                  }
                  return `This will permanently delete ${deleteTarget.name}. This action cannot be undone.`;
                })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/95 text-destructive-foreground"
              disabled={
                deleteTarget
                  ? (countsByServiceId.get(deleteTarget.id) || 0) > 0 ||
                    (consultationCountsByServiceId.get(deleteTarget.id) || 0) > 0
                  : true
              }
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget);
                }
                setDeleteTarget(null);
              }}
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveTarget !== null} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Archive this service?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground/70">
              {archiveTarget?.name} will be hidden from public browsing but kept in the database for safety.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiveTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/95 text-primary-foreground"
              onClick={() => {
                if (archiveTarget) {
                  archiveMutation.mutate(archiveTarget);
                }
                setArchiveTarget(null);
              }}
            >
              Archive Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
