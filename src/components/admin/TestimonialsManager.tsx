import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, MessageSquareQuote, Plus, RefreshCw, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { isMissingSupabaseTableError } from "@/lib/supabase-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type TestimonialRow = {
  id: string;
  patient_name: string;
  patient_label: string | null;
  review: string;
  rating: number;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
};

const TESTIMONIALS_TABLE_NAME = "testimonials";
const TESTIMONIAL_IMAGES_BUCKET = "testimonial-images";

const EMPTY_FORM = {
  patient_name: "",
  patient_label: "",
  review: "",
  rating: 5,
  image_url: "",
  sort_order: 0,
  is_published: true,
};

function getStoragePathFromUrl(url: string): string | null {
  const marker = `/public/${TESTIMONIAL_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.substring(index + marker.length);
}

export function TestimonialsManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialRow | null>(null);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleSelectedFile(file: File) {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be 5 MB or smaller.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxDimension = 800;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Unable to prepare the profile image."));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed."))),
            "image/jpeg",
            0.86,
          );
        };
        image.onerror = () => reject(new Error("The selected image could not be read."));
        image.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("The selected image could not be read."));
      reader.readAsDataURL(file);
    });
  }

  const { data, isLoading, isError, error, refetch } = useQuery<TestimonialRow[]>({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) {
        setSchemaMissing(isMissingSupabaseTableError(error, TESTIMONIALS_TABLE_NAME));
        throw error;
      }
      setSchemaMissing(false);
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = form.image_url.trim() || null;
      let uploadedPath: string | null = null;

      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        const sourceName = imageFile.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
        uploadedPath = `${crypto.randomUUID()}/${sourceName || "patient"}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(TESTIMONIAL_IMAGES_BUCKET)
          .upload(uploadedPath, compressedImage, {
            contentType: "image/jpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(TESTIMONIAL_IMAGES_BUCKET).getPublicUrl(uploadedPath);
        imageUrl = publicUrl;
      }

      const payload = {
        patient_name: form.patient_name.trim(),
        patient_label: form.patient_label.trim() || null,
        review: form.review.trim(),
        rating: form.rating,
        image_url: imageUrl,
        sort_order: form.sort_order,
        is_published: form.is_published,
      };
      const result = editing
        ? await supabase.from("testimonials").update(payload).eq("id", editing.id)
        : await supabase.from("testimonials").insert([payload]);
      if (result.error) {
        if (uploadedPath) {
          await supabase.storage.from(TESTIMONIAL_IMAGES_BUCKET).remove([uploadedPath]);
        }
        throw result.error;
      }

      if (imageFile && editing?.image_url) {
        const oldPath = getStoragePathFromUrl(editing.image_url);
        if (oldPath) {
          const { error: cleanupError } = await supabase.storage
            .from(TESTIMONIAL_IMAGES_BUCKET)
            .remove([oldPath]);
          if (cleanupError) console.warn("Unable to remove old testimonial image:", cleanupError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success(editing ? "Testimonial updated." : "Testimonial added.");
      setIsOpen(false);
      setImageFile(null);
      setImagePreview("");
    },
    onError: (err: Error) => toast.error(err.message || "Unable to save testimonial."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: TestimonialRow) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", item.id);
      if (error) throw error;

      if (item.image_url) {
        const storagePath = getStoragePathFromUrl(item.image_url);
        if (storagePath) {
          const { error: cleanupError } = await supabase.storage
            .from(TESTIMONIAL_IMAGES_BUCKET)
            .remove([storagePath]);
          if (cleanupError) console.warn("Unable to remove testimonial image:", cleanupError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial deleted.");
    },
    onError: (err: Error) => toast.error(err.message || "Unable to delete testimonial."),
  });

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: data?.length || 0 });
    setImageFile(null);
    setImagePreview("");
    setIsOpen(true);
  }

  function openEdit(item: TestimonialRow) {
    setEditing(item);
    setForm({
      patient_name: item.patient_name,
      patient_label: item.patient_label || "",
      review: item.review,
      rating: item.rating,
      image_url: item.image_url || "",
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setImageFile(null);
    setImagePreview(item.image_url || "");
    setIsOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (schemaMissing) {
      toast.error(
        "The testimonials table is missing from Supabase. Run the new testimonials migration and reload schema cache.",
      );
      return;
    }
    if (!form.patient_name.trim() || !form.review.trim()) {
      toast.error("Patient name and review are required.");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-4 pb-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-xl font-bold">Manage Testimonials</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Curate the patient stories shown on the homepage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openAdd} disabled={schemaMissing}>
            <Plus className="mr-1 h-4 w-4" /> Add Testimonial
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading testimonials...</p>
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed border-destructive/20 bg-destructive/5 py-16 text-center text-destructive">
            <p className="font-semibold">Could not load testimonials</p>
            <p className="mt-1 text-sm">{error?.message}</p>
            {schemaMissing && (
              <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-destructive/20 bg-background/80 px-4 py-3 text-left text-sm text-foreground">
                <p className="font-semibold text-destructive">Missing `public.testimonials`</p>
                <p className="mt-1 text-muted-foreground">
                  Apply the testimonials migration in
                  `supabase/migrations/20260619173000_testimonials.sql` or the repair migration,
                  then reload the Supabase schema cache.
                </p>
              </div>
            )}
          </div>
        ) : !data?.length ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 py-20 text-center">
            <MessageSquareQuote className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-semibold">No testimonials yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first patient story to replace the homepage sample content.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => (
              <article
                key={item.id}
                className="flex flex-col rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover object-top"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                      {item.patient_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{item.patient_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.patient_label || "Verified patient"}
                    </div>
                  </div>
                  <span
                    className={
                      item.is_published
                        ? "rounded-full bg-success/10 px-2 py-1 text-[0.65rem] font-bold uppercase text-success"
                        : "rounded-full bg-muted px-2 py-1 text-[0.65rem] font-bold uppercase text-muted-foreground"
                    }
                  >
                    {item.is_published ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="mt-4 flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${index < item.rating ? "fill-current" : "text-border"}`}
                    />
                  ))}
                </div>
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-6 text-muted-foreground">
                  “{item.review}”
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">Order: {item.sort_order}</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(item)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit {item.patient_name}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete {item.patient_name}</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="patient-name">Patient name *</Label>
                  <Input
                    id="patient-name"
                    value={form.patient_name}
                    onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                    placeholder="e.g. Priya Shah"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patient-label">Patient label</Label>
                  <Input
                    id="patient-label"
                    value={form.patient_label}
                    onChange={(e) => setForm({ ...form, patient_label: e.target.value })}
                    placeholder="e.g. Cardiac care patient"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review">Review *</Label>
                <Textarea
                  id="review"
                  rows={5}
                  maxLength={700}
                  value={form.review}
                  onChange={(e) => setForm({ ...form, review: e.target.value })}
                  placeholder="Share the patient's experience..."
                />
                <div className="text-right text-xs text-muted-foreground">
                  {form.review.length}/700
                </div>
              </div>
              <div className="space-y-2">
                <Label>Patient profile image</Label>
                <div
                  className="flex min-h-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/5 p-4 text-center transition-colors hover:border-primary/50"
                  onClick={() => document.getElementById("testimonial-profile-image")?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const file = event.dataTransfer.files?.[0];
                    if (file) handleSelectedFile(file);
                  }}
                >
                  <input
                    id="testimonial-profile-image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleSelectedFile(file);
                    }}
                  />
                  {imagePreview ? (
                    <div className="flex items-center gap-5">
                      <img
                        src={imagePreview}
                        alt="Patient profile preview"
                        className="h-28 w-28 rounded-full border-4 border-white object-cover object-top shadow-md ring-1 ring-border"
                      />
                      <div className="text-left">
                        <p className="text-sm font-semibold">Profile image selected</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Click or drop another image to replace it.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">Drag a patient photo here</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        or click to select a JPG, PNG, or WEBP image
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Faces are positioned from the top for a natural circular portrait. Maximum 5 MB.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rating">Star rating</Label>
                  <select
                    id="rating"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} star{rating === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sort-order">Display order</Label>
                  <Input
                    id="sort-order"
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-xs text-muted-foreground">Show this story on the homepage.</p>
                </div>
                <Switch
                  id="published"
                  checked={form.is_published}
                  onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                />
              </div>
              <DialogFooter className="border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || schemaMissing}>
                  {saveMutation.isPending ? "Saving..." : "Save Testimonial"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
              <AlertDialogDescription>
                The patient story from {deleteTarget?.patient_name} will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget);
                  setDeleteTarget(null);
                }}
                disabled={schemaMissing}
              >
                Delete Testimonial
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
