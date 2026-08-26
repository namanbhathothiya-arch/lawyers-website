import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Info, Loader2, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAboutContent, useSaveAboutContent, type DBAboutContent } from "@/hooks/use-about-content";

const FALLBACK: Omit<DBAboutContent, "id" | "created_at" | "updated_at"> = {
  firm_name: "Our Firm",
  eyebrow: "ABOUT OUR FIRM",
  headline: "Experienced counsel. Clear strategy. Trusted representation.",
  subheadline:
    "A client-focused legal practice built around thoughtful advice, careful preparation, and direct communication.",
  mission:
    "We help individuals, families, and businesses understand their legal position, evaluate their options, and move forward with confidence.",
  story: "",
  approach: "",
  confidentiality_note: "",
  consultation_note: "",
  primary_cta_label: "Book a Consultation",
  primary_cta_url: "/appointment",
  secondary_cta_label: "Meet Our Lawyers",
  secondary_cta_url: "/doctors",
  hero_image_url: null,
  is_published: true,
};

export function AboutUsManager() {
  const { data: dbRecord, isLoading, isError, error } = useAdminAboutContent();
  const saveMutation = useSaveAboutContent();

  const [form, setForm] = useState<typeof FALLBACK & { id?: string }>(FALLBACK);
  const [saved, setSaved] = useState(false);
  const initialised = useRef(false);

  // Populate form from DB once loaded
  useEffect(() => {
    if (dbRecord && !initialised.current) {
      initialised.current = true;
      setForm({
        id: dbRecord.id,
        firm_name: dbRecord.firm_name ?? "",
        eyebrow: dbRecord.eyebrow ?? "",
        headline: dbRecord.headline ?? "",
        subheadline: dbRecord.subheadline ?? "",
        mission: dbRecord.mission ?? "",
        story: dbRecord.story ?? "",
        approach: dbRecord.approach ?? "",
        confidentiality_note: dbRecord.confidentiality_note ?? "",
        consultation_note: dbRecord.consultation_note ?? "",
        primary_cta_label: dbRecord.primary_cta_label ?? "Book a Consultation",
        primary_cta_url: dbRecord.primary_cta_url ?? "/appointment",
        secondary_cta_label: dbRecord.secondary_cta_label ?? "Meet Our Lawyers",
        secondary_cta_url: dbRecord.secondary_cta_url ?? "/doctors",
        hero_image_url: dbRecord.hero_image_url ?? null,
        is_published: dbRecord.is_published ?? true,
      });
    }
  }, [dbRecord]);

  const set = (field: keyof typeof FALLBACK, value: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(form);
      setSaved(true);
      toast.success("About Us content saved successfully.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Save failed: ${msg}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-900/40 bg-red-950/20">
        <CardContent className="p-6 text-red-400">
          <p className="font-semibold">Failed to load About content</p>
          <p className="mt-1 text-sm text-red-300">{error instanceof Error ? error.message : "Unknown error"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* STATUS / PUBLISH TOGGLE */}
      <Card className="border-slate-800 bg-[#0d1828]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <FileText className="h-4 w-4 text-blue-400" />
            About Us Page Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Switch
              id="is_published"
              checked={form.is_published}
              onCheckedChange={(v) => set("is_published", v)}
            />
            <Label htmlFor="is_published" className="text-sm text-slate-200 cursor-pointer">
              {form.is_published ? (
                <span className="flex items-center gap-1.5 text-green-400 font-medium">
                  <ToggleRight className="h-4 w-4" /> Published — visible on public site
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <ToggleLeft className="h-4 w-4" /> Unpublished — hidden from visitors
                </span>
              )}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* HERO / HEADLINE FIELDS */}
      <Section title="Hero & Headline" icon={<Info className="h-4 w-4 text-blue-400" />}>
        <FieldRow label="Eyebrow (small label above heading)" htmlFor="eyebrow">
          <Input
            id="eyebrow"
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="ABOUT OUR FIRM"
            maxLength={120}
            className="admin-input"
          />
        </FieldRow>
        <FieldRow label="Headline" htmlFor="headline">
          <Input
            id="headline"
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="Experienced counsel. Clear strategy. Trusted representation."
            maxLength={250}
            className="admin-input"
          />
        </FieldRow>
        <FieldRow label="Subheadline / Tagline" htmlFor="subheadline">
          <Input
            id="subheadline"
            value={form.subheadline}
            onChange={(e) => set("subheadline", e.target.value)}
            placeholder="A client-focused legal practice..."
            maxLength={400}
            className="admin-input"
          />
        </FieldRow>
        <FieldRow label="Hero Image URL (optional)" htmlFor="hero_image_url">
          <Input
            id="hero_image_url"
            value={form.hero_image_url ?? ""}
            onChange={(e) => set("hero_image_url", e.target.value || null)}
            placeholder="https://... (leave blank to use design placeholder)"
            maxLength={600}
            className="admin-input"
          />
        </FieldRow>
      </Section>

      {/* CONTENT FIELDS */}
      <Section title="Content" icon={<FileText className="h-4 w-4 text-blue-400" />}>
        <FieldRow label="Mission Statement" htmlFor="mission">
          <Textarea
            id="mission"
            value={form.mission}
            onChange={(e) => set("mission", e.target.value)}
            rows={3}
            maxLength={1200}
            className="admin-input resize-y"
          />
          <CharCount value={form.mission} max={1200} />
        </FieldRow>

        <FieldRow label="Firm Story (supports line breaks)" htmlFor="story">
          <Textarea
            id="story"
            value={form.story}
            onChange={(e) => set("story", e.target.value)}
            rows={8}
            maxLength={4000}
            className="admin-input resize-y"
            placeholder="Enter 2–3 professional paragraphs separated by blank lines..."
          />
          <CharCount value={form.story} max={4000} />
        </FieldRow>

        <FieldRow label="Our Approach (supports line breaks)" htmlFor="approach">
          <Textarea
            id="approach"
            value={form.approach}
            onChange={(e) => set("approach", e.target.value)}
            rows={6}
            maxLength={3000}
            className="admin-input resize-y"
            placeholder="Each approach point on a new line, e.g.&#10;Clear Advice: We explain...&#10;Strategic Preparation: ..."
          />
          <CharCount value={form.approach} max={3000} />
        </FieldRow>

        <FieldRow label="Confidentiality Note" htmlFor="confidentiality_note">
          <Textarea
            id="confidentiality_note"
            value={form.confidentiality_note}
            onChange={(e) => set("confidentiality_note", e.target.value)}
            rows={3}
            maxLength={800}
            className="admin-input resize-y"
          />
        </FieldRow>

        <FieldRow label="Consultation Invitation" htmlFor="consultation_note">
          <Textarea
            id="consultation_note"
            value={form.consultation_note}
            onChange={(e) => set("consultation_note", e.target.value)}
            rows={3}
            maxLength={600}
            className="admin-input resize-y"
          />
        </FieldRow>
      </Section>

      {/* CTA FIELDS */}
      <Section title="Call-to-Action Buttons" icon={<CheckCircle2 className="h-4 w-4 text-blue-400" />}>
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow label="Primary Button Label" htmlFor="primary_cta_label">
            <Input
              id="primary_cta_label"
              value={form.primary_cta_label}
              onChange={(e) => set("primary_cta_label", e.target.value)}
              maxLength={80}
              className="admin-input"
            />
          </FieldRow>
          <FieldRow label="Primary Button URL" htmlFor="primary_cta_url">
            <Input
              id="primary_cta_url"
              value={form.primary_cta_url}
              onChange={(e) => set("primary_cta_url", e.target.value)}
              maxLength={300}
              className="admin-input"
            />
          </FieldRow>
          <FieldRow label="Secondary Button Label" htmlFor="secondary_cta_label">
            <Input
              id="secondary_cta_label"
              value={form.secondary_cta_label}
              onChange={(e) => set("secondary_cta_label", e.target.value)}
              maxLength={80}
              className="admin-input"
            />
          </FieldRow>
          <FieldRow label="Secondary Button URL" htmlFor="secondary_cta_url">
            <Input
              id="secondary_cta_url"
              value={form.secondary_cta_url}
              onChange={(e) => set("secondary_cta_url", e.target.value)}
              maxLength={300}
              className="admin-input"
            />
          </FieldRow>
        </div>
      </Section>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="min-h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 shadow-md"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="mr-2 h-4 w-4" />Saved!</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />Save About Content</>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ---- helpers ---- */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-800 bg-[#0d1828]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-100">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-300">
        {label}
      </Label>
      {children}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const nearLimit = len > max * 0.85;
  return (
    <p className={`text-right text-[0.7rem] mt-1 ${nearLimit ? "text-amber-400" : "text-slate-500"}`}>
      {len}/{max}
    </p>
  );
}
