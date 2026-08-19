import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEGAL_SERVICES } from "@/lib/clinic-data";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServices } from "@/hooks/use-supabase-data";
import {
  formatIndianPhone,
  isValidIndianMobileNumber,
  normalizeIndianPhone,
} from "@/lib/booking-utils";

const notSureValue = "__not_sure__";

type ContactInquiryFormProps = {
  title: string;
  description: string;
  buttonLabel: string;
  eyebrow?: string;
  className?: string;
  note?: string;
  successTitle?: string;
  successDescription?: string;
  submitHint?: string;
  autoFocus?: boolean;
};

export function ContactInquiryForm({
  title,
  description,
  buttonLabel,
  eyebrow = "Contact form",
  className,
  note = "This website provides general information and does not constitute legal advice. A lawyer-client relationship is not created just by sending this form.",
  successTitle = "Message received",
  successDescription = "Thank you. The office will review your message and follow up as soon as practical.",
  submitHint = "Tell us a little about the matter and we’ll respond with the most suitable next step.",
  autoFocus = false,
}: ContactInquiryFormProps) {
  const { data: services } = useServices();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [legalMatter, setLegalMatter] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const legalServiceOptions = useMemo(() => (services?.length ? services : LEGAL_SERVICES), [services]);
  const fieldPrefix = eyebrow.toLowerCase().replace(/\s+/g, "-");

  const formReady =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    legalMatter.trim().length > 0 &&
    message.trim().length > 0 &&
    isValidIndianMobileNumber(phone);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formReady || loading) {
      toast.error("Please complete all contact fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: normalizeIndianPhone(phone.trim()),
          legal_matter: legalMatter === notSureValue ? "Not sure yet" : legalMatter,
          message: message.trim(),
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setLegalMatter("");
      setMessage("");
      toast.success("Your message has been sent.");
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unable to send your message.";
      toast.error(messageText);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className={cn(
        "rounded-[2rem] border-primary/10 shadow-[0_30px_90px_-55px_rgba(16,45,75,0.7)]",
        className,
      )}
    >
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        {submitted && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-foreground"
          >
            <strong className="block font-semibold">{successTitle}</strong>
            <p className="mt-1 text-muted-foreground">{successDescription}</p>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" id={`${fieldPrefix}-full-name`}>
            <Input
              id={`${fieldPrefix}-full-name`}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              autoFocus={autoFocus}
            />
          </Field>

          <Field label="Email" id={`${fieldPrefix}-email`}>
            <Input
              id={`${fieldPrefix}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          <Field label="Mobile number" id={`${fieldPrefix}-phone`}>
            <Input
              id={`${fieldPrefix}-phone`}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel-national"
            />
            {phone && !isValidIndianMobileNumber(phone) && (
              <p className="mt-1 text-xs text-destructive">
                Please enter a valid 10-digit Indian mobile number.
              </p>
            )}
            {phone && isValidIndianMobileNumber(phone) && (
              <p className="mt-1 text-xs text-muted-foreground">
                We will save this as {formatIndianPhone(normalizeIndianPhone(phone))}.
              </p>
            )}
          </Field>

          <Field label="Legal issue / service" id={`${fieldPrefix}-legal-matter`}>
            <Select value={legalMatter} onValueChange={setLegalMatter}>
              <SelectTrigger id={`${fieldPrefix}-legal-matter`} className="min-h-11">
                <SelectValue placeholder="Select a legal service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={notSureValue}>Not sure yet</SelectItem>
                {legalServiceOptions.map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Message" id={`${fieldPrefix}-message`}>
              <Textarea
                id={`${fieldPrefix}-message`}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Briefly describe the matter, deadlines, or questions you would like to discuss."
                rows={7}
              />
            </Field>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-6 text-muted-foreground">{note}</p>
            <Button
              type="submit"
              size="lg"
              className="min-h-11 rounded-full px-6"
              disabled={loading}
            >
              {loading ? "Sending..." : buttonLabel}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-xs leading-6 text-muted-foreground">{submitHint}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
