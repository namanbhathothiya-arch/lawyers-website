import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, HelpCircle, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
import type { DBFaq } from "@/hooks/use-supabase-data";

const EMPTY_FORM = {
  question: "",
  answer: "",
  category: "",
  sort_order: 0,
  is_published: true,
};

const FAQ_QUESTION_MAX_LENGTH = 1000;
const FAQ_ANSWER_MAX_LENGTH = 2000;

type FaqForm = typeof EMPTY_FORM;

export function FaqsManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<DBFaq | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DBFaq | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<DBFaq[]>({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() || null,
        sort_order: form.sort_order,
        is_published: form.is_published,
        updated_at: new Date().toISOString(),
      };

      const result = editing
        ? await supabase.from("faqs").update(payload).eq("id", editing.id)
        : await supabase.from("faqs").insert([payload]);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "faqs"] });
      toast.success(editing ? "FAQ updated." : "FAQ added.");
      setIsOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || "Unable to save FAQ."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "faqs"] });
      toast.success("FAQ deleted.");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to delete FAQ."),
  });

  const filteredFaqs = (data || []).filter((faq) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${faq.question} ${faq.answer} ${faq.category || ""}`.toLowerCase().includes(query);
  });

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: data?.length || 0 });
    setIsOpen(true);
  }

  function openEdit(faq: DBFaq) {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setIsOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-4 pb-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-xl font-bold">Manage FAQs</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the searchable FAQ answers shown on the homepage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Add FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <label htmlFor="admin-faq-search" className="sr-only">
          Search FAQs
        </label>
        <div className="relative mb-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="admin-faq-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search FAQs by question, answer, or category..."
            className="pl-9"
            type="search"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading FAQs...</p>
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed border-destructive/20 bg-destructive/5 py-16 text-center text-destructive">
            <p className="font-semibold">Could not load FAQs</p>
            <p className="mt-1 text-sm">{error?.message}</p>
          </div>
        ) : !data?.length ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 py-20 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-semibold">No FAQs yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first question patients often ask.
            </p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 py-16 text-center">
            <p className="font-semibold">No matching FAQs</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredFaqs.map((faq) => (
              <article
                key={faq.id}
                className="flex min-w-0 flex-col rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold leading-6 [overflow-wrap:anywhere]">
                      {faq.question}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {faq.category && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                          {faq.category}
                        </span>
                      )}
                      <span
                        className={
                          faq.is_published
                            ? "rounded-full bg-success/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-success"
                            : "rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground"
                        }
                      >
                        {faq.is_published ? "Live" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(faq)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit FAQ</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteTarget(faq)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete FAQ</span>
                    </Button>
                  </div>
                </div>
                <p className="mt-4 line-clamp-4 flex-1 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                  {faq.answer}
                </p>
                <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                  Order: {faq.sort_order}
                </div>
              </article>
            ))}
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq-question">Question *</Label>
                <Input
                  id="faq-question"
                  value={form.question}
                  onChange={(event) => setForm({ ...form, question: event.target.value })}
                  placeholder="e.g. How do I prepare for my visit?"
                  maxLength={FAQ_QUESTION_MAX_LENGTH}
                />
                <div className="text-right text-xs text-muted-foreground">
                  {form.question.length}/{FAQ_QUESTION_MAX_LENGTH}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-answer">Answer *</Label>
                <Textarea
                  id="faq-answer"
                  rows={6}
                  value={form.answer}
                  onChange={(event) => setForm({ ...form, answer: event.target.value })}
                  placeholder="Write a clear, patient-friendly answer..."
                  maxLength={FAQ_ANSWER_MAX_LENGTH}
                />
                <div className="text-right text-xs text-muted-foreground">
                  {form.answer.length}/{FAQ_ANSWER_MAX_LENGTH}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="faq-category">Category</Label>
                  <Input
                    id="faq-category"
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    placeholder="e.g. Appointments"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-order">Display order</Label>
                  <Input
                    id="faq-order"
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(event) =>
                      setForm({ ...form, sort_order: Number(event.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="faq-published">Published</Label>
                  <p className="text-xs text-muted-foreground">Show this FAQ on the homepage.</p>
                </div>
                <Switch
                  id="faq-published"
                  checked={form.is_published}
                  onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                />
              </div>
              <DialogFooter className="border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save FAQ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
              <AlertDialogDescription className="max-h-40 overflow-y-auto pr-1">
                This will permanently remove “{deleteTarget?.question}” from the FAQ list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:space-x-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Delete FAQ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
