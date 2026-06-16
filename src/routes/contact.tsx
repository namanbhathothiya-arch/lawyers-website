import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Advanced Care Medical Clinic" },
      {
        name: "description",
        content:
          "Call, email, or visit Advanced Care Medical Clinic. We're here to help with appointments and queries.",
      },
      { property: "og:title", content: "Contact — Advanced Care Medical Clinic" },
      {
        property: "og:description",
        content:
          "Call, email, or visit Advanced Care Medical Clinic. We're here to help with appointments and queries.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/contact" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contact — Advanced Care Medical Clinic" },
      {
        name: "twitter:description",
        content:
          "Call, email, or visit Advanced Care Medical Clinic. We're here to help with appointments and queries.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": CLINIC.name,
    "image": "https://advancedcareclinic.com/og-image.jpg",
    "telephone": CLINIC.phone,
    "email": CLINIC.email,
    "url": "https://advancedcareclinic.com/contact",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "12 Wellness Avenue, MG Road",
      "addressLocality": "Bengaluru",
      "addressRegion": "KA",
      "postalCode": "560001",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "20:00"
      }
    ]
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json">
        {JSON.stringify(contactSchema)}
      </script>
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">
          Reach out for appointments, queries or feedback — we usually respond within a few hours.
        </p>
      </div>

      <div className="mt-12 grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <ContactCard
            icon={Phone}
            label="Phone"
            value={CLINIC.phone}
            href={`tel:${CLINIC.phone}`}
          />
          <ContactCard
            icon={Mail}
            label="Email"
            value={CLINIC.email}
            href={`mailto:${CLINIC.email}`}
          />
          <ContactCard icon={MapPin} label="Address" value={CLINIC.address} />
          <ContactCard
            icon={Clock}
            label="Hours"
            value="Mon – Sat · 9:00 AM – 8:00 PM · Sun closed"
          />

          <Button asChild size="lg" className="bg-[#25D366] hover:bg-[#22c55e] text-white">
            <a href={`https://wa.me/${CLINIC.whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp
            </a>
          </Button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-border shadow-sm aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
          <iframe
            title="Clinic location"
            src={CLINIC.mapsEmbed}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-4 rounded-xl border border-border p-5 bg-card hover:border-primary/40 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-primary-light text-primary grid place-items-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </div>
        <div className="mt-1 font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
