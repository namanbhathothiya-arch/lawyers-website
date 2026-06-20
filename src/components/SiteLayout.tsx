import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Clock,
  Facebook,
  HeartPulse,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Stethoscope,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import { CLINIC } from "@/lib/clinic-data";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/doctors", label: "Doctors" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const patientLinks = [
  { to: "/appointment", label: "Book Appointment" },
  { to: "/services", label: "Our Services" },
  { to: "/doctors", label: "Find a Doctor" },
  { to: "/gallery", label: "Clinic Gallery" },
  { to: "/contact", label: "Get Directions" },
] as const;

const contactNumber = CLINIC.phone.replace(/[^\d+]/g, "");
const emergencyNumber = CLINIC.emergencyPhone.replace(/[^\d+]/g, "");

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const socialLinks = [
    { label: "Facebook", href: CLINIC.socials.facebook, icon: Facebook },
    { label: "Instagram", href: CLINIC.socials.instagram, icon: Instagram },
    { label: "LinkedIn", href: CLINIC.socials.linkedin, icon: Linkedin },
    { label: "YouTube", href: CLINIC.socials.youtube, icon: Youtube },
    { label: "X", href: CLINIC.socials.x, icon: Twitter },
  ].filter((link) => Boolean(link.href));

  const isPortal =
    (location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff")) &&
    !(location.pathname === "/admin/login" || location.pathname === "/admin/login/");

  if (isPortal) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-base sm:text-lg leading-tight">
              {CLINIC.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-primary bg-primary-light" }}
                inactiveProps={{
                  className: "text-foreground/70 hover:text-foreground hover:bg-muted",
                }}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${CLINIC.phone}`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <Phone className="h-4 w-4" /> {CLINIC.phone}
            </a>
            <Button asChild size="sm">
              <Link to="/appointment">Book Appointment</Link>
            </Button>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-md hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{ className: "text-primary bg-primary-light" }}
                  inactiveProps={{ className: "text-foreground/80 hover:bg-muted" }}
                  className="block px-3 py-3 rounded-md text-base font-medium"
                >
                  {n.label}
                </Link>
              ))}
              <Button asChild className="w-full mt-2" onClick={() => setOpen(false)}>
                <Link to="/appointment">Book Appointment</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="relative mt-20 overflow-hidden border-t border-primary/10 bg-[#071d33] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,113,227,0.25),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(46,196,182,0.18),transparent_28rem)]" />
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-7 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-light">
                <HeartPulse className="h-3.5 w-3.5" />
                Premium healthcare support
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Need help choosing the right care?
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                Our team can guide you to the right doctor, service, or appointment slot with clear,
                compassionate support.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[22rem]">
              <a
                href={`tel:${contactNumber}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <Phone className="h-4 w-4" />
                Call clinic
              </a>
              <Link
                to="/appointment"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Book visit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.15fr]">
            <div className="min-w-0">
              <Link to="/" className="inline-flex max-w-full items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-lg shadow-primary/20">
                  <Stethoscope className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block break-words font-display text-lg font-bold leading-tight">
                    {CLINIC.name}
                  </span>
                  <span className="mt-1 block text-xs font-medium uppercase tracking-[0.22em] text-primary-light">
                    {CLINIC.specialization}
                  </span>
                </span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">{CLINIC.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-light" />
                  Trusted care
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                  <HeartPulse className="h-3.5 w-3.5 text-primary-light" />
                  Patient-first clinic
                </span>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    Follow us
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;

                      return (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Follow ${CLINIC.name} on ${social.label}`}
                          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Quick links
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-white/68">
                {nav.map((n) => (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className="group inline-flex items-center gap-2 transition hover:text-white"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-primary-light opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100" />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Patient links
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-white/68">
                {patientLinks.map((n) => (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className="group inline-flex items-center gap-2 transition hover:text-white"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-primary-light opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100" />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Contact details
              </h4>
              <ul className="mt-4 space-y-4 text-sm text-white/70">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                  <span className="min-w-0 break-words">{CLINIC.address}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                  <span className="min-w-0 space-y-1">
                    <a
                      href={`tel:${contactNumber}`}
                      className="block break-words transition hover:text-white"
                    >
                      {CLINIC.phone}
                    </a>
                    <a
                      href={`tel:${emergencyNumber}`}
                      className="block break-words font-semibold text-red-200 transition hover:text-white"
                    >
                      Emergency: {CLINIC.emergencyPhone}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                  <a
                    href={`mailto:${CLINIC.email}`}
                    className="min-w-0 break-all transition hover:text-white"
                  >
                    {CLINIC.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                  <span className="min-w-0 break-words">
                    {CLINIC.workingDays}
                    <br />
                    {CLINIC.workingHours}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>
              © {new Date().getFullYear()} {CLINIC.name}. All rights reserved.
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>Designed for compassionate healthcare experiences.</span>
              <Link to="/admin" className="transition hover:text-white">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${CLINIC.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-lg hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M19.11 17.21c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.89 0-10.67 4.78-10.67 10.67 0 1.88.49 3.71 1.42 5.32L5.33 26.67l5.51-1.44a10.6 10.6 0 0 0 5.18 1.32h.01c5.88 0 10.66-4.78 10.66-10.67 0-2.85-1.11-5.53-3.12-7.55a10.6 10.6 0 0 0-7.55-3z" />
        </svg>
      </a>
    </div>
  );
}
