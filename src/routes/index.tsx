import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  HeartPulse,
  Award,
  Star,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImg from "@/assets/hero-clinic.jpg";
import { TESTIMONIALS, CLINIC, getDoctorImage } from "@/lib/clinic-data";
import { useDoctors, useServices } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Advanced Care Medical Clinic — Expert Multi-Specialty Care" },
      {
        name: "description",
        content:
          "Book trusted doctors across general medicine, cardiology, dermatology and orthopedics at Advanced Care Medical Clinic.",
      },
      { property: "og:title", content: "Advanced Care Medical Clinic — Expert Multi-Specialty Care" },
      {
        property: "og:description",
        content:
          "Book trusted doctors across general medicine, cardiology, dermatology and orthopedics at Advanced Care Medical Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Advanced Care Medical Clinic — Expert Multi-Specialty Care" },
      {
        name: "twitter:description",
        content:
          "Book trusted doctors across general medicine, cardiology, dermatology and orthopedics at Advanced Care Medical Clinic.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const {
    data: doctors,
    isLoading: loadingDoctors,
    isError: errorDoctors,
    error: docError,
    refetch: refetchDoctors,
  } = useDoctors();
  const {
    data: services,
    isLoading: loadingServices,
    isError: errorServices,
    error: svcError,
    refetch: refetchServices,
  } = useServices();

  const clinicSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": "https://advancedcareclinic.com/#clinic",
        "name": CLINIC.name,
        "url": "https://advancedcareclinic.com",
        "logo": "https://advancedcareclinic.com/favicon.svg",
        "image": "https://advancedcareclinic.com/og-image.jpg",
        "description": "Premium multi-doctor clinic offering compassionate, expert care across general medicine, cardiology, dermatology and orthopedics.",
        "telephone": CLINIC.phone,
        "email": CLINIC.email,
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
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://advancedcareclinic.com/#business",
        "name": CLINIC.name,
        "image": "https://advancedcareclinic.com/og-image.jpg",
        "telephone": CLINIC.phone,
        "url": "https://advancedcareclinic.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "12 Wellness Avenue, MG Road",
          "addressLocality": "Bengaluru",
          "addressRegion": "KA",
          "postalCode": "560001",
          "addressCountry": "IN"
        },
        "priceRange": "$$"
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(clinicSchema)}
      </script>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-light via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light text-primary px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> NABH-aligned clinical standards
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground">
              Compassionate care, <span className="text-primary">advanced medicine.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              {CLINIC.name} brings together specialists across medicine, cardiology, dermatology and
              orthopedics — under one calm, modern roof.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/appointment">
                  Book Appointment <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/doctors">Meet our doctors</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { n: "25+", l: "Specialists" },
                { n: "40k+", l: "Patients cared" },
                { n: "4.9★", l: "Patient rating" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-foreground">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
            <img
              src={heroImg}
              alt="Modern interior of Advanced Care Medical Clinic"
              width={1600}
              height={1024}
              className="relative rounded-2xl shadow-2xl object-cover w-full aspect-[4/3]"
            />
            <Card className="absolute -bottom-6 -left-6 hidden sm:block w-56 shadow-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/15 text-success grid place-items-center">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Open today</div>
                  <div className="text-xs text-muted-foreground">9:00 AM – 8:00 PM</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, t: "Verified Specialists" },
            { icon: Clock, t: "On-time Appointments" },
            { icon: Award, t: "Evidence-based Care" },
            { icon: HeartPulse, t: "Patient-first Approach" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3">
              <f.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* DOCTORS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader
          eyebrow="Our team"
          title="Meet our featured doctors"
          subtitle="A multi-disciplinary team committed to your long-term health."
        />

        {loadingDoctors ? (
          <DoctorsSkeleton />
        ) : errorDoctors ? (
          <ErrorState message={docError?.message || "Unknown error"} retry={refetchDoctors} />
        ) : !doctors || doctors.length === 0 ? (
          <EmptyState
            title="No doctors found"
            description="There are no doctors registered in the database yet. Please configure them in the admin dashboard."
          />
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((d) => (
              <Card key={d.id} className="overflow-hidden group">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={getDoctorImage(d.id, d.photo)}
                    alt={d.name}
                    width={768}
                    height={768}
                    loading="lazy"
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="text-sm text-primary">{d.specialization}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.experience} experience</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/doctors">View all doctors</Link>
          </Button>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Services"
            title="Care designed around you"
            subtitle="From routine check-ups to specialist consultations — transparent pricing, every time."
          />

          {loadingServices ? (
            <ServicesSkeleton />
          ) : errorServices ? (
            <ErrorState message={svcError?.message || "Unknown error"} retry={refetchServices} />
          ) : !services || services.length === 0 ? (
            <EmptyState
              title="No services found"
              description="There are no services registered in the database yet. Please configure them in the admin dashboard."
            />
          ) : (
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((s) => (
                <Card key={s.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className="text-primary font-bold whitespace-nowrap">{s.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/services">All services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader eyebrow="Patient stories" title="Loved by our patients" />
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-yellow-500 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">"{t.text}"</p>
                <div className="mt-4 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground text-xs">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 lg:p-14 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to see a doctor?</h2>
            <p className="mt-3 text-primary-foreground/80 max-w-lg">
              Book online in under a minute. We'll confirm your slot instantly.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/appointment">Book Appointment</Link>
            </Button>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4" /> {CLINIC.phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4" /> {CLINIC.email}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4" /> {CLINIC.address}
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl sm:text-4xl font-bold">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function DoctorsSkeleton() {
  return (
    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <CardContent className="p-5 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ServicesSkeleton() {
  return (
    <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mt-10 p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center max-w-xl mx-auto">
      <p className="text-destructive font-medium">Failed to load database records</p>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 p-10 rounded-2xl border border-dashed border-border text-center max-w-md mx-auto">
      <p className="font-semibold text-lg">{title}</p>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
