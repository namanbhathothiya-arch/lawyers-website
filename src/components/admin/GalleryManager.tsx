import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, Trash2, Edit2, Upload, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cleanHeroImageUrl, isLegacyHeroImage, setLegacyHeroImage } from "@/lib/hero-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type GalleryImage = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  is_hero_image: boolean;
  created_at: string;
};

// Helper to extract file path from public Supabase Storage URL
function getStoragePathFromUrl(url: string, bucketName = "clinic-gallery"): string | null {
  url = cleanHeroImageUrl(url);
  const marker = `/public/${bucketName}/`;
  const index = url.indexOf(marker);
  if (index !== -1) {
    return url.substring(index + marker.length);
  }
  return null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isMissingHeroColumn(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : getErrorMessage(error);
  return message.includes("is_hero_image") && message.includes("schema cache");
}

export function GalleryManager() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteImage, setDeleteImage] = useState<GalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isHeroImage, setIsHeroImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // Reordering local state
  const [localImages, setLocalImages] = useState<GalleryImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch images
  const {
    data: images,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as GalleryImage[];
    },
  });

  // Sync query data to local state for drag and drop
  useEffect(() => {
    if (images) {
      setLocalImages(images);
    }
  }, [images]);

  // Handle file format & size validation
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

  // Helper to compress image
  async function compressImage(
    file: File,
    maxWidth = 1600,
    maxHeight = 1600,
  ): Promise<{ blob: Blob; extension: string; contentType: string }> {
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
                const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
                resolve({
                  blob,
                  contentType,
                  extension: contentType === "image/png" ? "png" : "jpg",
                });
              } else {
                reject(new Error("Image compression failed."));
              }
            },
            file.type === "image/png" ? "image/png" : "image/jpeg",
            0.85,
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // Upload/Add Mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error("Please select an image to upload.");
      if (!title.trim()) throw new Error("A title is required.");

      const toastId = toast.loading("Compressing & uploading image...");
      try {
        const compressedImage = await compressImage(imageFile);
        const uuid = crypto.randomUUID();
        const sourceName = imageFile.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
        const filePath = `${uuid}/${sourceName || "clinic-photo"}.${compressedImage.extension}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("clinic-gallery")
          .upload(filePath, compressedImage.blob, {
            contentType: compressedImage.contentType,
            upsert: true,
          });
        if (uploadError) throw uploadError;

        // Public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("clinic-gallery").getPublicUrl(filePath);

        // Insert database record
        const payload = {
          image_url: publicUrl,
          title: title.trim(),
          description: description.trim() || null,
          sort_order: Number.parseInt(sortOrder, 10) || 0,
        };
        const { error: dbError } = await supabase
          .from("gallery_images")
          .insert([{ ...payload, is_hero_image: isHeroImage }]);
        if (dbError) {
          if (!isMissingHeroColumn(dbError)) throw dbError;
          if (isHeroImage) {
            await Promise.all(
              (images || [])
                .filter((image) => isLegacyHeroImage(image.image_url))
                .map((image) =>
                  supabase
                    .from("gallery_images")
                    .update({ image_url: cleanHeroImageUrl(image.image_url) })
                    .eq("id", image.id),
                ),
            );
          }
          const { error: retryError } = await supabase.from("gallery_images").insert([
            {
              ...payload,
              image_url: setLegacyHeroImage(payload.image_url, isHeroImage),
            },
          ]);
          if (retryError) throw retryError;
          toast.success("Image saved and selected for the Hero Section.");
        }

        toast.success("Image added to gallery", { id: toastId });
      } catch (err: unknown) {
        toast.error(`Upload failed: ${getErrorMessage(err)}`, { id: toastId });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
      setSortOrder("0");
      setIsHeroImage(false);
      setImageFile(null);
      setImagePreview("");
    },
  });

  // Edit/Replace Mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingImage) return;
      if (!title.trim()) throw new Error("A title is required.");

      const toastId = toast.loading("Saving changes...");
      try {
        let updatedImageUrl = editingImage.image_url;

        // If a new file was chosen, upload it and clean up the old one
        if (imageFile) {
          const compressedImage = await compressImage(imageFile);
          const uuid = crypto.randomUUID();
          const sourceName = imageFile.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
          const filePath = `${uuid}/${sourceName || "clinic-photo"}.${compressedImage.extension}`;

          // Upload new
          const { error: uploadError } = await supabase.storage
            .from("clinic-gallery")
            .upload(filePath, compressedImage.blob, {
              contentType: compressedImage.contentType,
              upsert: true,
            });
          if (uploadError) throw uploadError;

          // Get new public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("clinic-gallery").getPublicUrl(filePath);

          updatedImageUrl = publicUrl;

          // Delete old storage object to prevent orphans
          const oldPath = getStoragePathFromUrl(editingImage.image_url);
          if (oldPath) {
            await supabase.storage.from("clinic-gallery").remove([oldPath]);
          }
        }

        // Update database record
        const payload = {
          image_url: updatedImageUrl,
          title: title.trim(),
          description: description.trim() || null,
          sort_order: Number.parseInt(sortOrder, 10) || 0,
        };
        const { error: dbError } = await supabase
          .from("gallery_images")
          .update({ ...payload, is_hero_image: isHeroImage })
          .eq("id", editingImage.id);

        if (dbError) {
          if (!isMissingHeroColumn(dbError)) throw dbError;
          if (isHeroImage) {
            await Promise.all(
              (images || [])
                .filter(
                  (image) => image.id !== editingImage.id && isLegacyHeroImage(image.image_url),
                )
                .map((image) =>
                  supabase
                    .from("gallery_images")
                    .update({ image_url: cleanHeroImageUrl(image.image_url) })
                    .eq("id", image.id),
                ),
            );
          }
          const { error: retryError } = await supabase
            .from("gallery_images")
            .update({
              ...payload,
              image_url: setLegacyHeroImage(payload.image_url, isHeroImage),
            })
            .eq("id", editingImage.id);
          if (retryError) throw retryError;
          toast.success("Image saved and selected for the Hero Section.");
        }

        toast.success("Gallery item updated successfully", { id: toastId });
      } catch (err: unknown) {
        toast.error(`Failed to update item: ${getErrorMessage(err)}`, { id: toastId });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      setIsEditOpen(false);
      setEditingImage(null);
      setTitle("");
      setDescription("");
      setSortOrder("0");
      setIsHeroImage(false);
      setImageFile(null);
      setImagePreview("");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: GalleryImage) => {
      const toastId = toast.loading("Deleting item...");
      try {
        // 1. Delete file from storage
        const storagePath = getStoragePathFromUrl(item.image_url);
        if (storagePath) {
          const { error: storageError } = await supabase.storage
            .from("clinic-gallery")
            .remove([storagePath]);
          if (storageError) console.error("Storage cleanup failed:", storageError);
        }

        // 2. Delete database record
        const { error: dbError } = await supabase.from("gallery_images").delete().eq("id", item.id);
        if (dbError) throw dbError;

        toast.success("Item deleted from gallery", { id: toastId });
      } catch (err: unknown) {
        toast.error(`Failed to delete: ${getErrorMessage(err)}`, { id: toastId });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      setDeleteImage(null);
    },
  });

  // Drag & Drop Sorting Handlers (HTML5 Native)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Swap positions visually in local state
    const newItems = [...localImages];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalImages(newItems);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    if (!images) return;

    // Check if the order actually changed
    const hasOrderChanged = localImages.some((img, idx) => img.id !== images[idx]?.id);

    if (!hasOrderChanged) return;

    const toastId = toast.loading("Saving new gallery order...");
    try {
      // Execute batch updates for sort_order values
      await Promise.all(
        localImages.map((img, idx) =>
          supabase.from("gallery_images").update({ sort_order: idx }).eq("id", img.id),
        ),
      );

      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast.success("Gallery order saved", { id: toastId });
    } catch (err: unknown) {
      toast.error(`Failed to save order: ${getErrorMessage(err)}`, { id: toastId });
    }
  };

  function handleOpenAdd() {
    setTitle("");
    setDescription("");
    const nextSortOrder = images?.length
      ? Math.max(...images.map((image) => image.sort_order)) + 1
      : 0;
    setSortOrder(String(nextSortOrder));
    setIsHeroImage(false);
    setImageFile(null);
    setImagePreview("");
    setIsAddOpen(true);
  }

  function handleOpenEdit(item: GalleryImage) {
    setEditingImage(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setSortOrder(String(item.sort_order));
    setIsHeroImage(item.is_hero_image || isLegacyHeroImage(item.image_url));
    setImageFile(null);
    setImagePreview(cleanHeroImageUrl(item.image_url));
    setIsEditOpen(true);
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold">Manage Clinic Gallery</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload clinic photos, manage titles and descriptions, and set their display order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Image
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading gallery images...</p>
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
            <p className="font-semibold">Error loading gallery</p>
            <p className="text-sm mt-1">{error?.message || "Unknown error occurred"}</p>
          </div>
        ) : !localImages || localImages.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
            <p className="font-semibold">No images in gallery</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Image" to upload photos of your clinic facilities.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-1 italic">
              * Hint: Drag any item using the grip handle on the left to reorder.
            </p>
            <div className="flex flex-col gap-2.5">
              {localImages.map((img, idx) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex flex-col gap-3 p-3.5 border border-border rounded-xl bg-background transition-all select-none sm:flex-row sm:items-center sm:justify-between ${
                    draggedIndex === idx
                      ? "opacity-40 border-primary scale-[0.99]"
                      : "hover:border-primary/20 hover:shadow-sm"
                  }`}
                >
                  <div className="flex min-w-0 w-full items-start gap-3 sm:items-center">
                    <div className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-border bg-muted p-1">
                      <img
                        src={img.image_url}
                        alt={img.title || "Gallery Item"}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm leading-tight text-foreground">
                          {img.title || "Untitled Gallery Item"}
                        </h4>
                        {(img.is_hero_image || isLegacyHeroImage(img.image_url)) && (
                          <Badge className="gap-1 bg-primary text-primary-foreground">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            Hero Image
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {img.description || "No description added."}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Order {img.sort_order} · Uploaded{" "}
                        {new Date(img.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 rounded-lg hover:border-primary/30 hover:text-primary transition-all"
                      onClick={() => handleOpenEdit(img)}
                      aria-label={`Edit ${img.title || "gallery item"}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setDeleteImage(img)}
                      aria-label={`Delete ${img.title || "gallery item"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIALOG: ADD IMAGE */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md bg-background border border-border max-h-[90vh] flex min-h-0 flex-col overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="text-xl font-bold">Add Gallery Image</DialogTitle>
              <DialogDescription>
                Add the photo details shown on the public gallery card and image viewer.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate();
              }}
              className="flex min-h-0 flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="img-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="img-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern Consultation Room"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="img-description">Description (Optional)</Label>
                  <Textarea
                    id="img-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Equipped with advanced diagnostic tools for accurate cardiac assessment."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {description.length}/500
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="img-sort-order">Sort Order</Label>
                  <Input
                    id="img-sort-order"
                    type="number"
                    min="0"
                    step="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary-light/40 p-4">
                  <div>
                    <Label htmlFor="add-hero-image" className="font-semibold">
                      Use as Hero Image
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Selecting this image automatically replaces the current hero image.
                    </p>
                  </div>
                  <Switch
                    id="add-hero-image"
                    checked={isHeroImage}
                    onCheckedChange={setIsHeroImage}
                    aria-label="Use as Hero Image"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Image File <span className="text-destructive">*</span>
                  </Label>
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
                    onClick={() => document.getElementById("add-gallery-file")?.click()}
                  >
                    <input
                      id="add-gallery-file"
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
                      <div className="relative group flex h-40 w-full items-center justify-center rounded-xl overflow-hidden shadow border border-border bg-muted p-2">
                        <img
                          src={imagePreview}
                          alt="Gallery Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Change Image</span>
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
              </div>

              <DialogFooter className="p-6 border-t border-border shrink-0 bg-background">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending || !imageFile || !title.trim()}
                >
                  {addMutation.isPending ? "Uploading..." : "Upload Photo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: EDIT / REPLACE IMAGE */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md bg-background border border-border max-h-[90vh] flex min-h-0 flex-col overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="text-xl font-bold">Edit Gallery Item</DialogTitle>
              <DialogDescription>
                Modify the gallery details, display order, or replace the current image.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editMutation.mutate();
              }}
              className="flex min-h-0 flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern Consultation Room"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Equipped with advanced diagnostic tools for accurate cardiac assessment."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {description.length}/500
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-sort-order">Sort Order</Label>
                  <Input
                    id="edit-sort-order"
                    type="number"
                    min="0"
                    step="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary-light/40 p-4">
                  <div>
                    <Label htmlFor="edit-hero-image" className="font-semibold">
                      Use as Hero Image
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Selecting this image automatically replaces the current hero image.
                    </p>
                  </div>
                  <Switch
                    id="edit-hero-image"
                    checked={isHeroImage}
                    onCheckedChange={setIsHeroImage}
                    aria-label="Use as Hero Image"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image File (Optional - upload to replace current image)</Label>
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
                    onClick={() => document.getElementById("edit-gallery-file")?.click()}
                  >
                    <input
                      id="edit-gallery-file"
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
                      <div className="relative group flex h-40 w-full items-center justify-center rounded-xl overflow-hidden shadow border border-border bg-muted p-2">
                        <img
                          src={imagePreview}
                          alt="Gallery Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Change Image</span>
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
              </div>

              <DialogFooter className="p-6 border-t border-border shrink-0 bg-background">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending || !title.trim()}>
                  {editMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ALERT: DELETE CONFIRMATION */}
        <AlertDialog
          open={deleteImage !== null}
          onOpenChange={(open) => !open && setDeleteImage(null)}
        >
          <AlertDialogContent className="bg-background border border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                This will permanently delete the gallery photo{" "}
                <span className="font-semibold text-foreground">
                  {deleteImage?.title || "Untitled Gallery Item"}
                </span>{" "}
                from both the database and Supabase storage. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteImage(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/95 text-destructive-foreground"
                onClick={() => {
                  if (deleteImage) {
                    deleteMutation.mutate(deleteImage);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Photo"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
