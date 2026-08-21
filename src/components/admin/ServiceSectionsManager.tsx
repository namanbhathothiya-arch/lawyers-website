import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Edit2, Loader2, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getServiceSectionPathSlug, slugifyServiceName } from "@/lib/service-slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Link } from "@tanstack/react-router";

type ServiceSection = {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  display_order: number;
  is_published: boolean;
  archived_at: string | null;
};

type ServiceSummary = {
  id: string;
  section_id: string | null;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_published: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  display_order: 0,
  is_published: true,
};

export function ServiceSectionsManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ServiceSection | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ServiceSection | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ServiceSection | null>(null);

  const {
    data: sections,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ServiceSection[]>({
    queryKey: ["admin-service-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sections")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as ServiceSection[];
    },
  });

  const { data: services } = useQuery<ServiceSummary[]>({
    queryKey: ["admin-service-section-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legal_services").select("id, section_id");
      if (error) throw error;
      return (data || []) as ServiceSummary[];
    },
  });

  const { data: allServicesForSlugs } = useQuery<{ id: string; name: string; slug?: string | null }[]>({
    queryKey: ["admin-service-sections", "slug-source"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legal_services").select("id, name, slug");
      if (error) throw error;
      return (data || []) as { id: string; name: string; slug?: string | null }[];
    },
  });

  const serviceCountBySectionId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const service of services || []) {
      if (!service.section_id) continue;
      counts.set(service.section_id, (counts.get(service.section_id) || 0) + 1);
    }
    return counts;
  }, [services]);

  function resetForm() {
    setEditingSection(null);
    setForm(EMPTY_FORM);
    setIsOpen(false);
  }

  function openAdd() {
    setEditingSection(null);
    setForm({
      ...EMPTY_FORM,
      display_order: sections?.length || 0,
    });
    setIsOpen(true);
  }

  function openEdit(section: ServiceSection) {
    setEditingSection(section);
    setForm({
      name: section.name,
      slug: section.slug || "",
      description: section.description || "",
      display_order: section.display_order ?? 0,
      is_published: section.is_published,
    });
    setIsOpen(true);
  }

  function buildPayload() {
    const id = editingSection?.id || crypto.randomUUID();
    const slug = form.slug.trim() || slugifyServiceName(form.name);
    return {
      id,
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      display_order: Number(form.display_order) || 0,
      is_published: form.is_published,
      archived_at: null,
      updated_at: new Date().toISOString(),
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editingSection) {
        const { error } = await supabase
          .from("service_sections")
          .update(payload)
          .eq("id", editingSection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_sections").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-sections"] });
      queryClient.invalidateQueries({ queryKey: ["service_sections"] });
      toast.success(editingSection ? "Service section updated." : "Service section added.");
      setIsOpen(false);
      setEditingSection(null);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to save service section.")),
  });

  const archiveMutation = useMutation({
    mutationFn: async (section: ServiceSection) => {
      const { error } = await supabase
        .from("service_sections")
        .update({
          is_published: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-sections"] });
      queryClient.invalidateQueries({ queryKey: ["service_sections"] });
      toast.success("Service section archived.");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to archive service section.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (section: ServiceSection) => {
      const { error } = await supabase.from("service_sections").delete().eq("id", section.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-sections"] });
      queryClient.invalidateQueries({ queryKey: ["service_sections"] });
      toast.success("Service section deleted.");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to delete service section.")),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Section name is required.");
      return;
    }
    saveMutation.mutate();
  }

  const title = "Service Sections";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Manage the top-level service sections that group specific legal services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openAdd} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Service Section
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading service sections...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-destructive/20 bg-destructive/5 py-16 text-center text-destructive">
          <p className="font-semibold">Could not load service sections</p>
          <p className="mt-1 text-sm">{error?.message}</p>
        </div>
      ) : !sections || sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/10 py-20 text-center">
          <Settings2 className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-semibold">No service sections yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the first section, then place specific services inside it.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const serviceCount = serviceCountBySectionId.get(section.id) || 0;
            const isArchived = Boolean(section.archived_at);
            const canDelete = serviceCount === 0;
            const sectionSlug = getServiceSectionPathSlug(
              { id: section.id, name: section.name, slug: section.slug || undefined },
              sections || [],
              allServicesForSlugs || [],
            );

            return (
              <Card
                key={section.id}
                className="relative flex min-w-0 flex-col overflow-hidden border-border bg-background shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="min-w-0 break-words text-lg [overflow-wrap:anywhere]">
                        {section.name}
                      </CardTitle>
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                        {serviceCount} services
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(section)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setArchiveTarget(section)}
                        disabled={isArchived}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(section)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="min-w-0 flex-1 pt-2">
                  <p className="min-w-0 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                    {section.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={isArchived ? "rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground" : "rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-600"}>
                      {isArchived ? "Archived" : section.is_published ? "Published" : "Hidden"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-600">
                      /services/{sectionSlug}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link
                      to="/admin/service-sections/$sectionId"
                      params={{ sectionId: section.id }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Manage services
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Published</span>
                      <Switch
                        checked={section.is_published}
                        onCheckedChange={(checked) =>
                          supabase
                            .from("service_sections")
                            .update({
                              is_published: checked,
                              updated_at: new Date().toISOString(),
                            })
                            .eq("id", section.id)
                            .then(({ error }) => {
                              if (error) {
                                toast.error(error.message);
                                return;
                              }
                              queryClient.invalidateQueries({ queryKey: ["admin-service-sections"] });
                              queryClient.invalidateQueries({ queryKey: ["service_sections"] });
                            })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg bg-background border border-border">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Service Section" : "Create Service Section"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="section-name">
                Section name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="section-name"
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
              <Label htmlFor="section-slug">Slug</Label>
              <Input
                id="section-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="auto-generated from name if blank"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="section-desc">Short description</Label>
              <Textarea
                id="section-desc"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="section-order">Display order</Label>
              <Input
                id="section-order"
                type="number"
                min={0}
                value={form.display_order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, display_order: Number(event.target.value) }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <Label htmlFor="section-published">Published</Label>
                <p className="text-xs text-muted-foreground">Show this section on the public directory.</p>
              </div>
              <Switch
                id="section-published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, is_published: checked }))}
              />
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Section"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service section?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                ((serviceCountBySectionId.get(deleteTarget.id) || 0) > 0
                  ? `This section still contains ${serviceCountBySectionId.get(deleteTarget.id) || 0} service(s). Archive it or move those services first.`
                  : `This will permanently delete ${deleteTarget.name}. This action cannot be undone.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                deleteTarget ? (serviceCountBySectionId.get(deleteTarget.id) || 0) > 0 : true
              }
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveTarget !== null} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this service section?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.name} will be hidden from public browsing but preserved for safety.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (archiveTarget) archiveMutation.mutate(archiveTarget);
                setArchiveTarget(null);
              }}
            >
              Archive Section
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
