import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  Scale,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAW_FIRM } from "@/lib/clinic-data";

const phoneHref = `tel:${LAW_FIRM.phone.replace(/[^\d+]/g, "")}`;
const emergencyHref = `tel:${LAW_FIRM.emergencyPhone.replace(/[^\d+]/g, "")}`;
const emailHref = `mailto:${LAW_FIRM.email}`;
const whatsappHref = `https://wa.me/${LAW_FIRM.whatsapp}`;
const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  LAW_FIRM.address,
)}`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Call, email, or visit ${LAW_FIRM.name} for advocate consultations and legal queries.`,
      },
      { property: "og:title", content: `Contact — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Call, email, or visit ${LAW_FIRM.name} for advocate consultations and legal queries.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: LAW_FIRM.name,
    telephone: LAW_FIRM.phone,
    email: LAW_FIRM.email,
    url: "https://sharmalaw.in/contact",
    address: {
      "@type": "PostalAddress",
      streetAddress: LAW_FIRM.address,
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
    <div className="relative isolate overflow-hidden bg-[#F8FAFC] text-slate-900 min-h-screen">
      <script type="application/ld+json">{JSON.stringify(contactSchema)}</script>

      {/* HERO HEADER */}
      <section className="relative border-b border-slate-800 bg-[#0B1630] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300 shadow-sm backdrop-blur">
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
              Contact Our Law Chambers
            </div>
            <h1 className="hero-display mt-6 font-serif text-4xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl">
              We’re here when your <span className="text-blue-400">matter needs action.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
              Call, email, message, or visit our chambers. Firm reception details are listed here.
              Each advocate’s own Call and WhatsApp numbers are on their individual profile.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">Chambers Open for Consultations</div>
                <div className="text-xs text-slate-300">
                  {LAW_FIRM.workingDays} · {LAW_FIRM.workingHours}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION CARDS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <ContactActionCard
            icon={Phone}
            eyebrow="Call Chambers"
            title={LAW_FIRM.phone}
            description="Direct connection to firm reception for appointments and urgent legal queries."
            href={phoneHref}
            cta="Call Now"
          />
          <ContactActionCard
            icon={Mail}
            eyebrow="Email Us"
            title={LAW_FIRM.email}
            description="Send court documents, legal briefs, or consultation inquiries."
            href={emailHref}
            cta="Send Email"
          />
          <ContactActionCard
            icon={MessageCircle}
            eyebrow="WhatsApp"
            title="Chat with Chambers"
            description="Quick consultation scheduling and document sharing via WhatsApp."
            href={whatsappHref}
            cta="Open WhatsApp"
            external
          />
          <ContactActionCard
            icon={Navigation}
            eyebrow="Directions"
            title={LAW_FIRM.address}
            description="Open Google Maps and navigate directly to our legal chambers."
            href={directionsHref}
            cta="Get Directions"
            external
          />
        </div>

        {/* DETAILS & MAP */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="grid gap-6">
            <InfoCard
              icon={Clock}
              eyebrow="Chambers Hours"
              title="Plan Your Consultation"
              description="Our legal advocates are available for in-person and online consultations during working hours."
            >
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-700">
                    {LAW_FIRM.workingDays}
                  </span>
                  <span className="text-sm font-bold text-blue-600">{LAW_FIRM.workingHours}</span>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2.5 text-xs text-slate-600">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>For immediate confirmation, book your appointment online prior to visiting.</span>
              </div>
            </InfoCard>

            <InfoCard
              icon={AlertTriangle}
              eyebrow="Urgent Legal Helpline"
              title="Immediate Legal Crisis?"
              description="For severe legal emergencies including arrests, police actions, or interim court stays."
              variant="emergency"
            >
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-sm"
                >
                  <a href={emergencyHref}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                    Urgent Helpline
                  </a>
                </Button>
                <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-800 rounded-xl shadow-sm">
                  <Link to="/appointment">Standard Meeting</Link>
                </Button>
              </div>
            </InfoCard>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Location & Map
                </div>
                <h2 className="mt-1 font-serif text-2xl font-bold text-slate-900">Visit Our Chambers</h2>
                <p className="mt-1 max-w-xl text-xs text-slate-600">{LAW_FIRM.address}</p>
              </div>
              <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-800 rounded-xl text-xs shadow-sm">
                <a href={directionsHref} target="_blank" rel="noreferrer">
                  <Navigation className="mr-1.5 h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  Map Directions
                </a>
              </Button>
            </div>

            <div className="aspect-[4/3] min-h-[320px] w-full sm:aspect-[16/10] lg:h-[calc(100%-116px)] lg:min-h-[480px]">
              <iframe
                title={`${LAW_FIRM.name} location map`}
                src={LAW_FIRM.mapsEmbed}
                className="h-full w-full filter contrast-[1.02]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-[#0B1630] p-6 text-white shadow-xl sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Privileged Advocate Consultation
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">Have legal documents to review?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Email your case documents or contact our reception. We will assign the appropriate legal specialist for your consultation.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 shadow-md">
              <a href={emailHref}>Email Documents</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-xl px-6"
            >
              <a href={phoneHref}>Call Reception</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
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
      className="group flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus-visible:outline-none"
    >
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-5 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
        {eyebrow}
      </span>
      <span className="mt-1.5 min-w-0 font-serif text-lg font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]">
        {title}
      </span>
      <span className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">{description}</span>
      <span className="mt-5 inline-flex items-center text-xs font-bold text-blue-600">
        {cta}
        <ArrowRight
          className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
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
          ? "rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm text-slate-900"
          : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900"
      }
    >
      <div
        className={
          isEmergency
            ? "grid h-12 w-12 place-items-center rounded-xl bg-amber-100 border border-amber-200 text-amber-700"
            : "grid h-12 w-12 place-items-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600"
        }
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div
        className={
          isEmergency
            ? "mt-5 text-[0.68rem] font-bold uppercase tracking-widest text-amber-700"
            : "mt-5 text-[0.68rem] font-bold uppercase tracking-widest text-blue-600"
        }
      >
        {eyebrow}
      </div>
      <h2 className="mt-1 font-serif text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{description}</p>
      {children}
    </article>
  );
}
