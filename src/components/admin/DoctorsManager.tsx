import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Check,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getLawyerImage } from "@/lib/clinic-data";
import { cleanLawyerPhoto, isLegacyHeroLawyer, setLegacyHeroLawyer } from "@/lib/hero-content";
import { getLawyerServiceSyncChanges, uniqueServiceIds } from "@/lib/doctor-service-utils";

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
  is_featured_hero?: boolean;
  lawyer_services?: LawyerServiceMapping[];
  doctor_services?: LawyerServiceMapping[];
};

type LegalServiceOption = {
  id: string;
  name: string;
  price: string;
};

export function DoctorsManager() {
  const queryClient = useQueryClient();

  const [editingLawyer, setEditingLawyer] = useState<AdminLawyer | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [photo, setPhoto] = useState("");
  const [bio, setBio] = useState("");
  const [isFeaturedHero, setIsFeaturedHero] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Lawyers
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lawyers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success("Lawyer removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lawyer: ${error.message}`);
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
    onError: (error: Error) => {
      toast.error(`Failed to set featured lawyer: ${error.message}`);
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
    onError: (error: Error) => {
      setUploading(false);
      toast.error(`Save failed: ${error.message}`);
    },
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
                <label className="text-sm font-medium">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Raj Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Specialization / Practice Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate Law"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Partner (15+ Yrs)"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Photo Upload / URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload photo"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                  <label className="cursor-pointer px-3 py-2 border border-input rounded-md bg-secondary/50 hover:bg-secondary text-sm flex items-center gap-2">
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
                {file && <p className="text-xs text-primary font-medium">Selected file: {file.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Biography / Professional Profile</label>
              <textarea
                rows={3}
                placeholder="Brief professional profile and experience summary..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            {/* Legal Service Mapping */}
            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>Assigned Legal Services</span>
              </label>
              <p className="text-xs text-muted-foreground">
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
                          : "border-border hover:bg-secondary/40 text-muted-foreground"
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
              <label htmlFor="isFeaturedHero" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Feature as Main Hero Lawyer on Homepage</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-secondary transition-colors"
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

      {/* Lawyers Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-lg text-destructive text-sm">
          Failed to load lawyers list.
        </div>
      ) : (lawyers || []).length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl bg-card">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No Lawyers Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your firm&apos;s lawyers to display on the booking portal.
          </p>
          <button
            onClick={handleCreateOpen}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg"
          >
            Add First Lawyer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(lawyers || []).map((lawyer) => {
            const isHero = lawyer.is_featured_hero || isLegacyHeroLawyer(lawyer.photo);
            const lawyerImg = getLawyerImage(lawyer.id, cleanLawyerPhoto(lawyer.photo));
            const assignedServices = lawyer.lawyer_services || lawyer.doctor_services || [];

            return (
              <div
                key={lawyer.id}
                className={`border rounded-xl bg-card p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isHero ? "ring-2 ring-amber-500/50 shadow-md" : "border-border"
                }`}
              >
                {isHero && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Sparkles className="h-3 w-3 fill-black" />
                    Featured Hero
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
                      <h3 className="font-semibold text-base">{lawyer.name}</h3>
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditOpen(lawyer)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                      title="Edit Lawyer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${lawyer.name}?`)) {
                          deleteMutation.mutate(lawyer.id);
                        }
                      }}
                      className="p-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Delete Lawyer"
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
