import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  HeartPulse,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic-data";

const phoneHref = `tel:${CLINIC.phone.replace(/[^\d+]/g, "")}`;
const emergencyHref = `tel:${CLINIC.emergencyPhone.replace(/[^\d+]/g, "")}`;
const emailHref = `mailto:${CLINIC.email}`;
const whatsappHref = `https://wa.me/${CLINIC.whatsapp}`;
const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  CLINIC.address,
)}`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — HeartCare Advanced Clinic" },
      {
        name: "description",
        content:
          "Call, email, or visit HeartCare Advanced Clinic for cardiac appointments and queries.",
      },
      { property: "og:title", content: "Contact — HeartCare Advanced Clinic" },
      {
        property: "og:description",
        content:
          "Call, email, or visit HeartCare Advanced Clinic for cardiac appointments and queries.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://heartcareclinic.com/contact" },
      { property: "og:image", content: "https://heartcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contact — HeartCare Advanced Clinic" },
      {
        name: "twitter:description",
        content:
          "Call, email, or visit HeartCare Advanced Clinic for cardiac appointments and queries.",
      },
      { name: "twitter:image", content: "https://heartcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://heartcareclinic.com/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: CLINIC.name,
    image: "https://heartcareclinic.com/og-image.jpg",
    telephone: CLINIC.phone,
    email: CLINIC.email,
    url: "https://heartcareclinic.com/contact",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Medical Plaza",
      addressLocality: "New Delhi",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };

  return (
    <main className="relative isolate overflow-hidden">
      <script type="application/ld+json">{JSON.stringify(contactSchema)}</script>

      <section className="relative border-b border-primary/10 bg-[linear-gradient(135deg,oklch(0.985_0.012_230),white_54%,oklch(0.96_0.04_205))]">
        <div className="absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-accent/80 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
              Contact HeartCare
            </div>
            <h1 className="hero-display mt-6 text-5xl leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
              We’re here when your <span className="text-primary">heart needs answers.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Call, email, message, or visit us. Every contact path is designed to get you the right
              help quickly and clearly.
            </p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_24px_70px_-42px_rgba(16,45,75,0.65)] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
              </span>
              <div>
                <div className="text-sm font-bold">Appointments open</div>
                <div className="text-xs text-muted-foreground">
                  {CLINIC.workingDays} · {CLINIC.workingHours}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <ContactActionCard
            icon={Phone}
            eyebrow="Call reception"
            title={CLINIC.phone}
            description="Tap to call for appointments, rescheduling, or quick clinic queries."
            href={phoneHref}
            cta="Call now"
          />
          <ContactActionCard
            icon={Mail}
            eyebrow="Email us"
            title={CLINIC.email}
            description="Send reports, questions, or appointment-related requests."
            href={emailHref}
            cta="Send email"
          />
          <ContactActionCard
            icon={MessageCircle}
            eyebrow="WhatsApp"
            title="Chat with clinic"
            description="Message the care team for appointment help and routine queries."
            href={whatsappHref}
            cta="Open WhatsApp"
            external
          />
          <ContactActionCard
            icon={Navigation}
            eyebrow="Directions"
            title={CLINIC.address}
            description="Open Google Maps and navigate directly to the clinic."
            href={directionsHref}
            cta="Get directions"
            external
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="grid gap-6">
            <InfoCard
              icon={Clock}
              eyebrow="Working hours"
              title="Plan your visit"
              description="Our team is available for consultations and appointment support during clinic hours."
            >
              <div className="mt-5 rounded-2xl border border-primary/10 bg-primary-light/45 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    {CLINIC.workingDays}
                  </span>
                  <span className="text-sm font-bold text-primary">{CLINIC.workingHours}</span>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 text-sm text-muted-foreground">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>For best availability, book your preferred slot before visiting.</span>
              </div>
            </InfoCard>

            <InfoCard
              icon={AlertTriangle}
              eyebrow="Emergency contact"
              title="Need urgent help?"
              description="For severe chest pain, breathing difficulty, fainting, or stroke-like symptoms, seek emergency care immediately."
              variant="emergency"
            >
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <a href={emergencyHref}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                    Call emergency
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/appointment">Book regular visit</Link>
                </Button>
              </div>
            </InfoCard>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-card shadow-[0_30px_90px_-55px_rgba(16,45,75,0.7)]">
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Location
                </div>
                <h2 className="mt-1 text-2xl font-bold">Visit the clinic</h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{CLINIC.address}</p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <a href={directionsHref} target="_blank" rel="noreferrer">
                  <Navigation className="mr-2 h-4 w-4" aria-hidden="true" />
                  Directions
                </a>
              </Button>
            </div>

            <div className="aspect-[4/3] min-h-[320px] w-full sm:aspect-[16/10] lg:h-[calc(100%-116px)] lg:min-h-[520px]">
              <iframe
                title={`${CLINIC.name} location map`}
                src={CLINIC.mapsEmbed}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] bg-[#102d4b] p-6 text-white shadow-[0_24px_70px_-45px_rgba(16,45,75,0.7)] sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
              <ShieldCheck className="h-4 w-4 text-[#77dfba]" aria-hidden="true" />
              Secure patient communication
            </div>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Have reports or a concern?</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Email your reports or call reception. We’ll help you choose the right consultation
              path.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <a href={emailHref}>Email reports</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/25 bg-white/10 text-white hover:bg-white hover:text-[#102d4b]"
            >
              <a href={phoneHref}>Call reception</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactActionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  href,
  cta,
  external = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex min-w-0 flex-col rounded-[1.5rem] border border-primary/10 bg-card p-5 shadow-[0_18px_60px_-45px_rgba(16,45,75,0.65)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_26px_70px_-45px_rgba(16,45,75,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </span>
      <span className="mt-2 min-w-0 break-words text-lg font-bold leading-6 text-foreground [overflow-wrap:anywhere]">
        {title}
      </span>
      <span className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</span>
      <span className="mt-5 inline-flex items-center text-sm font-bold text-primary">
        {cta}
        <ArrowRight
          className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </a>
  );
}

function InfoCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  variant = "default",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: "default" | "emergency";
}) {
  const isEmergency = variant === "emergency";

  return (
    <article
      className={
        isEmergency
          ? "rounded-[2rem] border border-destructive/20 bg-destructive/5 p-6 shadow-sm"
          : "rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm"
      }
    >
      <div
        className={
          isEmergency
            ? "grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"
            : "grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary"
        }
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div
        className={
          isEmergency
            ? "mt-5 text-xs font-bold uppercase tracking-[0.18em] text-destructive"
            : "mt-5 text-xs font-bold uppercase tracking-[0.18em] text-primary"
        }
      >
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {children}
    </article>
  );
}
