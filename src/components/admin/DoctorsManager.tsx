import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, RefreshCw, UserCheck, BriefcaseMedical, Upload } from "lucide-react";
import { getDoctorImage } from "@/lib/clinic-data";
import { getDoctorServiceSyncChanges, uniqueServiceIds } from "@/lib/doctor-service-utils";
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

type DoctorServiceMapping = {
  service_id: string;
};

type AdminDoctor = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  photo?: string | null;
  bio?: string | null;
  doctor_services?: DoctorServiceMapping[];
};

type AdminService = {
  id: string;
  name: string;
};

export function DoctorsManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<AdminDoctor | null>(null);

  // Deletion confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [photo, setPhoto] = useState("");
  const [bio, setBio] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Image Upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleSelectedFile = (file: File) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Maximum permitted file size is 5 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Fetch Doctors
  const {
    data: doctors,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*, doctor_services(service_id)")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as AdminDoctor[];
    },
  });

  // Fetch Services for doctor-service assignments
  const {
    data: services,
    isLoading: loadingServices,
    isError: errorServices,
    error: servicesError,
  } = useQuery({
    queryKey: ["admin-services-for-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as AdminService[];
    },
  });

  // Open modal for Adding
  function handleAddOpen() {
    setEditingDoctor(null);
    setName("");
    setSpecialization("");
    setExperience("");
    setPhoto("");
    setBio("");
    setSelectedServiceIds([]);
    setImageFile(null);
    setImagePreview("");
    setIsOpen(true);
  }

  // Open modal for Editing
  function handleEditOpen(doc: AdminDoctor) {
    setEditingDoctor(doc);
    setName(doc.name);
    setSpecialization(doc.specialization);
    setExperience(doc.experience);
    setPhoto(doc.photo || "");
    setBio(doc.bio || "");
    setSelectedServiceIds((doc.doctor_services || []).map((mapping) => mapping.service_id));
    setImageFile(null);
    setImagePreview(doc.photo || "");
    setIsOpen(true);
  }

  function toggleService(serviceId: string, checked: boolean) {
    setSelectedServiceIds((current) => {
      if (checked) {
        return uniqueServiceIds([...current, serviceId]);
      }

      return current.filter((id) => id !== serviceId);
    });
  }

  async function syncDoctorServices(doctorId: string) {
    const { data: existingMappings, error: existingError } = await supabase
      .from("doctor_services")
      .select("service_id")
      .eq("doctor_id", doctorId);

    if (existingError) throw existingError;

    const currentServiceIds = (existingMappings || []).map((mapping) => mapping.service_id);
    const { add, remove } = getDoctorServiceSyncChanges(currentServiceIds, selectedServiceIds);

    if (remove.length > 0) {
      const { error } = await supabase
        .from("doctor_services")
        .delete()
        .eq("doctor_id", doctorId)
        .in("service_id", remove);
      if (error) throw error;
    }

    if (add.length > 0) {
      const { error } = await supabase.from("doctor_services").insert(
        add.map((serviceId) => ({
          doctor_id: doctorId,
          service_id: serviceId,
        })),
      );
      if (error) throw error;
    }
  }

  // Helper to compress image before uploading
  async function compressImage(file: File, maxWidth = 800, maxHeight = 800): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Image compression failed."));
              }
            },
            file.type === "image/png" ? "image/png" : "image/jpeg",
            0.85
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // Add/Edit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const doctorId = editingDoctor ? editingDoctor.id : crypto.randomUUID();
      let uploadedPhotoUrl = photo;

      if (imageFile) {
        const toastId = toast.loading("Uploading image...");
        try {
          // Compress the image
          const compressedBlob = await compressImage(imageFile);
          
          // Construct clean upload path
          const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filePath = `${doctorId}/${cleanFileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from("doctor-images")
            .upload(filePath, compressedBlob, {
              contentType: imageFile.type,
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Retrieve public url
          const { data: { publicUrl } } = supabase.storage
            .from("doctor-images")
            .getPublicUrl(filePath);

          uploadedPhotoUrl = publicUrl;
          toast.success("Image uploaded successfully", { id: toastId });
        } catch (uploadErr: any) {
          toast.error(`Upload failed: ${uploadErr.message || uploadErr}`, { id: toastId });
          throw uploadErr;
        }
      }

      const docPayload = {
        name,
        specialization,
        experience,
        photo: uploadedPhotoUrl || null,
        bio: bio || null,
      };

      if (editingDoctor) {
        // Update
        const { error } = await supabase
          .from("doctors")
          .update(docPayload)
          .eq("id", editingDoctor.id);
        if (error) throw error;
        await syncDoctorServices(editingDoctor.id);
      } else {
        // Create (with custom id)
        const { error } = await supabase
          .from("doctors")
          .insert([{ id: doctorId, ...docPayload }]);
        if (error) throw error;
        await syncDoctorServices(doctorId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["service-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count"] });
      toast.success(editingDoctor ? "Doctor updated successfully!" : "Doctor added successfully!");
      setIsOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save doctor record.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Clean up Supabase Storage files associated with this doctor ID
      try {
        const { data: files, error: listError } = await supabase.storage
          .from("doctor-images")
          .list(id);
        
        if (!listError && files && files.length > 0) {
          const filesToRemove = files.map((file) => `${id}/${file.name}`);
          const { error: removeError } = await supabase.storage
            .from("doctor-images")
            .remove(filesToRemove);
          if (removeError) console.error("Failed to clean up files:", removeError);
        }
      } catch (err) {
        console.error("Storage clean up encountered error:", err);
      }

      // 2. Delete database record
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["service-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count"] });
      toast.success("Doctor record deleted successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete doctor. Ensure no appointments reference them.");
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !specialization || !experience) {
      toast.error("Please fill in all required fields (Name, Specialization, Experience)");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-xl font-bold">Manage Doctors</CardTitle>
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
            <Plus className="h-4 w-4" /> Add Doctor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* LOADING & ERROR STATES */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading doctors list...</p>
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
            <p className="font-semibold">Error loading doctors</p>
            <p className="text-sm mt-1">{error?.message || "Unknown error occurred"}</p>
          </div>
        ) : !doctors || doctors.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
            <p className="font-semibold">No doctors registered</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Doctor" to create your first practitioner profile.
            </p>
          </div>
        ) : (
          /* LIST GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((d) => (
              <Card
                key={d.id}
                className="overflow-hidden border-border bg-background hover:shadow-md transition-shadow relative"
              >
                <div className="aspect-[4/3] bg-muted relative">
                  <img
                    src={getDoctorImage(d.id, d.photo)}
                    alt={d.name}
                    className="h-full w-full object-cover object-top"
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 hover:bg-background shadow"
                      onClick={() => handleEditOpen(d)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 shadow"
                      onClick={() => {
                        setDeleteId(d.id);
                        setDeleteName(d.name);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-primary" /> {d.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mt-0.5">{d.specialization}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.experience} experience</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <BriefcaseMedical className="h-3.5 w-3.5 text-primary" />
                    Services: {d.doctor_services?.length || 0}
                  </div>
                  {d.bio && (
                    <p className="text-sm text-foreground/80 mt-3 line-clamp-2 leading-relaxed">
                      {d.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* DIALOG MODAL (ADD / EDIT) */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-lg bg-background border border-border max-h-[90vh] flex flex-col overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="text-xl font-bold">
                {editingDoctor ? "Edit Doctor Profile" : "Create New Doctor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-name">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Aisha Rao"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="doc-spec">
                    Specialization <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="doc-spec"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. General Physician"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-exp">
                    Experience <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="doc-exp"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8 years"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Doctor Photo</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleSelectedFile(files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 bg-secondary/5 max-h-[220px] overflow-hidden"
                  onClick={() => document.getElementById("doc-photo-file")?.click()}
                >
                  <input
                    id="doc-photo-file"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleSelectedFile(files[0]);
                      }
                    }}
                  />
                  {imagePreview ? (
                    <div className="relative group w-32 h-32 max-h-[200px] rounded-xl overflow-hidden shadow border border-border">
                      <img
                        src={imagePreview}
                        alt="Doctor Preview"
                        className="w-full h-full object-cover object-top max-h-[200px]"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium">Drag photo here</p>
                      <p className="text-xs text-muted-foreground">or click to Select Image</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, JPEG, PNG, WEBP. Max size: 5 MB.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-bio">Short Biography</Label>
                <Textarea
                  id="doc-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe doctor clinical interests, background..."
                  rows={3}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div>
                  <Label>Services Provided</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select every service this doctor can be booked for.
                  </p>
                </div>

                {loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading services...
                  </div>
                ) : errorServices ? (
                  <p className="text-sm text-destructive">
                    Failed to load services: {servicesError?.message || "Unknown error"}
                  </p>
                ) : !services || services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No services exist yet. Add services before assigning them to doctors.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        htmlFor={`service-${service.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/30 cursor-pointer"
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={(checked) => toggleService(service.id, checked === true)}
                        />
                        <span className="font-medium">{service.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              </div>

              <DialogFooter className="p-6 border-t border-border shrink-0 bg-background">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || loadingServices}>
                  {saveMutation.isPending ? "Saving..." : "Save Record"}
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
                This will permanently delete the practitioner profile for{" "}
                <span className="font-semibold text-foreground">{deleteName}</span> and remove all
                their associated availability and holiday configurations. This action cannot be
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
                Delete Profile
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
