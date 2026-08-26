import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Briefcase,
  Check,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { parseLawyerDeleteError } from "@/lib/supabase-errors";
import { getLawyerImage } from "@/lib/clinic-data";
import { cleanLawyerPhoto, isLegacyHeroLawyer, setLegacyHeroLawyer } from "@/lib/hero-content";
import { getLawyerServiceSyncChanges } from "@/lib/doctor-service-utils";

type LawyerServiceMapping = {
  service_id: string;
};

type AdminLawyer = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  photo?: string | null;
  bio?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  is_featured_hero?: boolean;
  is_active?: boolean;
  lawyer_services?: LawyerServiceMapping[];
  doctor_services?: LawyerServiceMapping[];
};

type LegalServiceOption = {
  id: string;
  name: string;
  price: string;
};

type DeleteModalState =
  | {
      step: "choice";
      lawyer: AdminLawyer;
    }
  | {
      step: "permanent_confirm";
      lawyer: AdminLawyer;
      checking: boolean;
      consultationCount: number;
      overrideErrorMessage?: string | null;
    }
  | null;

export function DoctorsManager() {
  const queryClient = useQueryClient();

  const [editingLawyer, setEditingLawyer] = useState<AdminLawyer | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived" | "all">("active");

  // Deletion / Archiving Dialog State
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>(null);

  // Form State
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [photo, setPhoto] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isFeaturedHero, setIsFeaturedHero] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Lawyers (includes active and archived for admin portal)
  const {
    data: lawyers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*, lawyer_services(service_id)")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        lawyer_services: row.lawyer_services || (row as { doctor_services?: LawyerServiceMapping[] }).doctor_services || [],
      })) as AdminLawyer[];
    },
  });

  // Fetch Legal Services for assignment
  const { data: legalServices } = useQuery({
    queryKey: ["admin-services-for-lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_services")
        .select("id, name, price")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as LegalServiceOption[];
    },
  });

  function resetForm() {
    setName("");
    setSpecialization("");
    setExperience("");
    setPhoto("");
    setBio("");
    setPhoneNumber("");
    setWhatsappNumber("");
    setIsFeaturedHero(false);
    setSelectedServiceIds([]);
    setFile(null);
    setIsCreating(false);
    setEditingLawyer(null);
  }

  function handleCreateOpen() {
    resetForm();
    setIsCreating(true);
  }

  function handleEditOpen(lawyer: AdminLawyer) {
    setEditingLawyer(lawyer);
    setName(lawyer.name);
    setSpecialization(lawyer.specialization);
    setExperience(lawyer.experience);
    setPhoto(cleanLawyerPhoto(lawyer.photo) || "");
    setBio(lawyer.bio || "");
    setPhoneNumber(lawyer.phone_number || (lawyer as { phone?: string }).phone || "");
    setWhatsappNumber(lawyer.whatsapp_number || (lawyer as { whatsapp?: string }).whatsapp || "");
    setIsFeaturedHero(lawyer.is_featured_hero || isLegacyHeroLawyer(lawyer.photo));
    const mappings = lawyer.lawyer_services || lawyer.doctor_services || [];
    setSelectedServiceIds(mappings.map((mapping) => mapping.service_id));
    setFile(null);
    setIsCreating(false);
  }

  function toggleServiceSelection(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  }

  async function syncLawyerServices(lawyerId: string) {
    const { data: existingRows, error: fetchErr } = await supabase
      .from("lawyer_services")
      .select("service_id")
      .eq("lawyer_id", lawyerId);

    if (fetchErr) throw fetchErr;

    const currentServiceIds = (existingRows || []).map((row) => row.service_id);
    const { add, remove } = getLawyerServiceSyncChanges(currentServiceIds, selectedServiceIds);

    if (remove.length > 0) {
      const { error } = await supabase
        .from("lawyer_services")
        .delete()
        .eq("lawyer_id", lawyerId)
        .in("service_id", remove);
      if (error) throw error;
    }

    if (add.length > 0) {
      const { error } = await supabase.from("lawyer_services").insert(
        add.map((serviceId) => ({
          lawyer_id: lawyerId,
          service_id: serviceId,
        })),
      );
      if (error) throw error;
    }
  }

  // Opens Choice Modal ("Manage Lawyer Profile")
  function handleOpenDeleteChoiceModal(lawyer: AdminLawyer) {
    setDeleteModalState({
      step: "choice",
      lawyer,
    });
  }

  // Option 1: Archive Lawyer
  function handleSelectArchive(lawyer: AdminLawyer) {
    archiveMutation.mutate(lawyer.id);
  }

  // Option 2: Delete Permanently -> Triggers Dependency Check & Confirmation Dialog
  async function handleSelectDeletePermanently(lawyer: AdminLawyer) {
    setDeleteModalState({
      step: "permanent_confirm",
      lawyer,
      checking: true,
      consultationCount: 0,
    });

    try {
      const { count, error } = await supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("lawyer_id", lawyer.id);

      if (error) {
        const formattedErr = parseLawyerDeleteError(error);
        setDeleteModalState({
          step: "permanent_confirm",
          lawyer,
          checking: false,
          consultationCount: -1,
          overrideErrorMessage: `Database query error: ${formattedErr}. Permanent deletion decision stopped for safety.`,
        });
        return;
      }

      setDeleteModalState({
        step: "permanent_confirm",
        lawyer,
        checking: false,
        consultationCount: count ?? 0,
      });
    } catch (err) {
      console.error("Error checking lawyer dependencies:", err);
      const formattedErr = parseLawyerDeleteError(err);
      setDeleteModalState({
        step: "permanent_confirm",
        lawyer,
        checking: false,
        consultationCount: -1,
        overrideErrorMessage: `Database query error: ${formattedErr}. Permanent deletion decision stopped for safety.`,
      });
    }
  }

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lawyers")
        .update({ is_active: false, is_featured_hero: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success("Lawyer archived. Historical consultations remain intact.");
      setDeleteModalState(null);
    },
    onError: (error: unknown) => {
      const msg = parseLawyerDeleteError(error);
      toast.error(msg);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lawyers")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success("Lawyer reactivated successfully.");
    },
    onError: (error: unknown) => {
      const msg = parseLawyerDeleteError(error);
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Safely remove non-historical dependent relationship records
      const { error: lsErr } = await supabase.from("lawyer_services").delete().eq("lawyer_id", id);
      if (lsErr) throw lsErr;

      const { error: availErr } = await supabase.from("availability").delete().eq("lawyer_id", id);
      if (availErr) throw availErr;

      const { error: holErr } = await supabase.from("lawyer_holidays").delete().eq("lawyer_id", id);
      if (holErr) throw holErr;

      const { error: roleErr } = await supabase.from("user_roles").update({ lawyer_id: null }).eq("lawyer_id", id);
      if (roleErr) throw roleErr;

      const { error: delErr } = await supabase.from("lawyers").delete().eq("id", id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success("Lawyer permanently deleted.");
      setDeleteModalState(null);
    },
    onError: (error: unknown) => {
      const formattedError = parseLawyerDeleteError(error);
      if (deleteModalState && deleteModalState.step === "permanent_confirm") {
        setDeleteModalState({
          ...deleteModalState,
          consultationCount: 1,
          overrideErrorMessage: formattedError,
        });
      } else {
        toast.error(formattedError);
      }
    },
  });

  const setHeroMutation = useMutation({
    mutationFn: async (lawyer: AdminLawyer) => {
      const { error: resetError } = await supabase
        .from("lawyers")
        .update({ is_featured_hero: false })
        .neq("id", lawyer.id);

      if (resetError) throw resetError;

      const updatedPhoto = setLegacyHeroLawyer(cleanLawyerPhoto(lawyer.photo), true);
      const { error: updateError } = await supabase
        .from("lawyers")
        .update({
          is_featured_hero: true,
          photo: updatedPhoto,
        })
        .eq("id", lawyer.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success("Featured Lawyer updated");
    },
    onError: (error: unknown) => {
      toast.error(parseLawyerDeleteError(error));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let uploadedPhotoUrl = photo;

      const lawyerId = editingLawyer ? editingLawyer.id : crypto.randomUUID();

      if (file) {
        const fileExt = file.name.split(".").pop();
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${lawyerId}/${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("lawyer-images")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("lawyer-images").getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrl;
      }

      const docPayload = {
        name,
        specialization,
        experience,
        bio: bio || null,
        phone_number: phoneNumber.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        is_featured_hero: isFeaturedHero,
        photo: setLegacyHeroLawyer(uploadedPhotoUrl || null, isFeaturedHero),
      };

      if (editingLawyer) {
        if (isFeaturedHero) {
          const { error: resetErr } = await supabase
            .from("lawyers")
            .update({ is_featured_hero: false })
            .neq("id", editingLawyer.id);

          if (resetErr) throw resetErr;

          const legacyHeroMatches = (lawyers || []).filter(
            (l) => l.id !== editingLawyer.id && isLegacyHeroLawyer(l.photo),
          );

          await Promise.all(
            legacyHeroMatches.map((l) =>
              supabase
                .from("lawyers")
                .update({ photo: cleanLawyerPhoto(l.photo) })
                .eq("id", l.id),
            ),
          );
        }

        const { error } = await supabase
          .from("lawyers")
          .update(docPayload)
          .eq("id", editingLawyer.id);

        if (error) throw error;

        await syncLawyerServices(editingLawyer.id);
      } else {
        if (isFeaturedHero) {
          await supabase
            .from("lawyers")
            .update({ is_featured_hero: false })
            .neq("id", lawyerId);

          const legacyHeroMatches = (lawyers || []).filter((l) => isLegacyHeroLawyer(l.photo));

          await Promise.all(
            legacyHeroMatches.map((l) =>
              supabase
                .from("lawyers")
                .update({ photo: cleanLawyerPhoto(l.photo) })
                .eq("id", l.id),
            ),
          );
        }

        const { error } = await supabase.from("lawyers").insert([{ id: lawyerId, ...docPayload }]);

        if (error) throw error;

        await syncLawyerServices(lawyerId);
      }
    },
    onSuccess: () => {
      setUploading(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success(editingLawyer ? "Lawyer updated" : "Lawyer created");
    },
    onError: (error: unknown) => {
      setUploading(false);
      toast.error(`Save failed: ${parseLawyerDeleteError(error)}`);
    },
  });

  const activeCount = (lawyers || []).filter((l) => l.is_active !== false).length;
  const archivedCount = (lawyers || []).filter((l) => l.is_active === false).length;
  const allCount = (lawyers || []).length;

  const filteredLawyersList = (lawyers || []).filter((lawyer) => {
    const isActive = lawyer.is_active !== false;
    if (activeTab === "active") return isActive;
    if (activeTab === "archived") return !isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lawyers Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage your firm&apos;s legal practitioners, bios, and service assignments.
          </p>
        </div>

        {!isCreating && !editingLawyer && (
          <button
            onClick={handleCreateOpen}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Lawyer
          </button>
        )}
      </div>

      {/* STEP 1 & STEP 2 CONFIRMATION MODALS */}
      {deleteModalState && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in-50 zoom-in-95">
            {/* STEP 1: CHOICE DIALOG ("Manage Lawyer Profile") */}
            {deleteModalState.step === "choice" && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                    <Archive className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground">Manage Lawyer Profile</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Choose what you want to do with <span className="font-semibold text-foreground">{deleteModalState.lawyer.name}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectArchive(deleteModalState.lawyer)}
                    disabled={archiveMutation.isPending}
                    className="w-full px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-input rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {archiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Archive className="h-4 w-4 text-amber-500" />
                    <span>Archive Lawyer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDeletePermanently(deleteModalState.lawyer)}
                    className="w-full px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Permanently</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalState(null)}
                    className="w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pt-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: PERMANENT DELETE CONFIRMATION & DEPENDENCY DIALOG */}
            {deleteModalState.step === "permanent_confirm" && (
              <>
                {deleteModalState.checking ? (
                  <div className="py-6 text-center space-y-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                    <p className="text-sm font-medium text-foreground">
                      Inspecting consultation history and database relationships...
                    </p>
                  </div>
                ) : deleteModalState.consultationCount > 0 || deleteModalState.overrideErrorMessage ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-foreground">Historical Consultations Detected</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {deleteModalState.overrideErrorMessage ||
                            `This lawyer has ${deleteModalState.consultationCount} historical consultation(s). Permanently deleting the lawyer is blocked because historical consultation records reference this lawyer to preserve client history.`}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                      Permanently deleting the lawyer may affect historical records. Archive is the recommended option to preserve client data.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setDeleteModalState(null)}
                        disabled={archiveMutation.isPending || deleteMutation.isPending}
                        className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectArchive(deleteModalState.lawyer)}
                        disabled={archiveMutation.isPending}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {archiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Archive Instead
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(deleteModalState.lawyer.id)}
                        disabled={deleteMutation.isPending}
                        className="px-4 py-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete Permanently
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                        <ShieldAlert className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-foreground">Delete Lawyer Permanently?</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          This action permanently removes <span className="font-semibold text-foreground">{deleteModalState.lawyer.name}</span> and cannot be undone.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/60 border border-border rounded-lg text-xs text-muted-foreground">
                      This lawyer has no historical consultations and can be permanently removed.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setDeleteModalState(null)}
                        disabled={deleteMutation.isPending}
                        className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(deleteModalState.lawyer.id)}
                        disabled={deleteMutation.isPending}
                        className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete Permanently
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Drawer / Container */}
      {(isCreating || editingLawyer) && (
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-semibold">
              {editingLawyer ? `Edit Lawyer: ${editingLawyer.name}` : "Create New Lawyer"}
            </h2>
            <button
              onClick={resetForm}
              className="p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Raj Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Specialization / Practice Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate Law"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Experience Level *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Partner (15+ Yrs)"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number (for Direct Voice Call)</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">WhatsApp Number (for Direct WhatsApp Chat)</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43211"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Photo Upload / URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload photo"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
                  />
                  <label className="cursor-pointer px-3 py-2 border border-input rounded-md bg-secondary/50 hover:bg-secondary text-sm text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {file && <p className="text-xs text-foreground/70 font-medium">Selected file: {file.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Biography / Professional Profile</label>
              <textarea
                rows={3}
                placeholder="Brief professional profile and experience summary..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-foreground/55"
              />
            </div>

            {/* Legal Service Mapping */}
            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>Assigned Legal Services</span>
              </label>
              <p className="text-xs text-foreground/70">
                Select which services this lawyer provides. Used for service-first booking filter.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {(legalServices || []).map((service) => {
                  const isChecked = selectedServiceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleServiceSelection(service.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 text-foreground font-medium"
                          : "border-border hover:bg-secondary/40 text-foreground/80"
                      }`}
                    >
                      <span>{service.name}</span>
                      {isChecked && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Hero Checkbox */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isFeaturedHero"
                checked={isFeaturedHero}
                onChange={(e) => setIsFeaturedHero(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="isFeaturedHero" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Feature as Main Hero Lawyer on Homepage</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {(saveMutation.isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingLawyer ? "Save Changes" : "Create Lawyer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "archived"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Archived ({archivedCount})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({allCount})
        </button>
      </div>

      {/* Lawyers Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-lg text-destructive text-sm">
          Failed to load lawyers list.
        </div>
      ) : filteredLawyersList.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl bg-card">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">
            {activeTab === "archived" ? "No Archived Lawyers" : "No Lawyers Found"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === "archived"
              ? "There are currently no archived or deactivated lawyers."
              : "Add your firm's lawyers to display on the booking portal."}
          </p>
          {activeTab !== "archived" && (
            <button
              onClick={handleCreateOpen}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg"
            >
              Add First Lawyer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyersList.map((lawyer) => {
            const isActive = lawyer.is_active !== false;
            const isHero = isActive && (lawyer.is_featured_hero || isLegacyHeroLawyer(lawyer.photo));
            const lawyerImg = getLawyerImage(lawyer.id, cleanLawyerPhoto(lawyer.photo));
            const assignedServices = lawyer.lawyer_services || lawyer.doctor_services || [];

            return (
              <div
                key={lawyer.id}
                className={`border rounded-xl bg-card p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  !isActive
                    ? "opacity-75 bg-secondary/20 border-dashed border-border"
                    : isHero
                    ? "ring-2 ring-amber-500/50 shadow-md border-amber-500/30"
                    : "border-border"
                }`}
              >
                {isHero && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Sparkles className="h-3 w-3 fill-black" />
                    Featured Hero
                  </div>
                )}

                {!isActive && (
                  <div className="absolute top-0 right-0 bg-slate-600 text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    Archived
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={lawyerImg}
                      alt={lawyer.name}
                      className="h-16 w-16 rounded-full object-cover border border-border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{lawyer.name}</h3>
                      </div>
                      <p className="text-xs font-medium text-primary">{lawyer.specialization}</p>
                      <p className="text-xs text-muted-foreground">{lawyer.experience}</p>
                    </div>
                  </div>

                  {lawyer.bio && <p className="text-xs text-muted-foreground line-clamp-2">{lawyer.bio}</p>}

                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Assigned Legal Services ({assignedServices.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {assignedServices.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">All services (fallback)</span>
                      ) : (
                        assignedServices.map((mapping) => {
                          const svc = (legalServices || []).find((s) => s.id === mapping.service_id);
                          return (
                            <span
                              key={mapping.service_id}
                              className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-medium"
                            >
                              {svc?.name || mapping.service_id}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  {isActive ? (
                    <button
                      onClick={() => setHeroMutation.mutate(lawyer)}
                      disabled={isHero || setHeroMutation.isPending}
                      className={`text-xs font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                        isHero
                          ? "text-amber-500 bg-amber-500/10 cursor-default"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${isHero ? "fill-amber-500" : ""}`} />
                      {isHero ? "Main Hero" : "Set Featured"}
                    </button>
                  ) : (
                    <button
                      onClick={() => reactivateMutation.mutate(lawyer.id)}
                      disabled={reactivateMutation.isPending}
                      className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      Reactivate
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditOpen(lawyer)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                      title="Edit Lawyer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteChoiceModal(lawyer)}
                      className="p-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Manage / Delete Lawyer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
