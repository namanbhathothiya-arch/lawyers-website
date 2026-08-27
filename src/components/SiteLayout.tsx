import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  Facebook,
  Scale,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Twitter,
  X,
  Youtube,
  MessageCircle,
  CalendarDays,
} from "lucide-react";
import { LAW_FIRM } from "@/lib/clinic-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLegalServices, useServiceSections } from "@/hooks/use-supabase-data";
import { getServiceIcon } from "@/lib/service-presentation";
import { getServiceSectionPathSlug } from "@/lib/service-slug";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/doctors", label: "Lawyers" },
  { to: "/services", label: "Legal Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const clientLinks = [
  { to: "/appointment", label: "Book a Consultation" },
  { to: "/services", label: "Our Legal Services" },
  { to: "/doctors", label: "Find a Lawyer" },
  { to: "/contact", label: "Get Directions" },
] as const;

const contactNumber = LAW_FIRM.phone.replace(/[^\d+]/g, "");
const emergencyNumber = LAW_FIRM.emergencyPhone.replace(/[^\d+]/g, "");

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: sections, isLoading: sectionsLoading } = useServiceSections();
  const { data: services } = useLegalServices();

  const sectionBlocks = useMemo(() => {
    if (!sections) return [];
    return sections.map((section) => ({
      section,
      slug: getServiceSectionPathSlug(section, sections, services || []),
      summary: section.description || "",
      Icon: getServiceIcon(section.name),
    }));
  }, [sections, services]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const socialLinks = [
    { label: "Facebook", href: LAW_FIRM.socials.facebook, icon: Facebook },
    { label: "Instagram", href: LAW_FIRM.socials.instagram, icon: Instagram },
    { label: "LinkedIn", href: LAW_FIRM.socials.linkedin, icon: Linkedin },
    { label: "YouTube", href: LAW_FIRM.socials.youtube, icon: Youtube },
    { label: "X", href: LAW_FIRM.socials.x, icon: Twitter },
  ].filter((link) => Boolean(link.href));

  const isPortal =
    (location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff")) &&
    !(location.pathname === "/admin/login" || location.pathname === "/admin/login/");

  const isLawyerProfile =
    location.pathname.startsWith("/doctors/") && location.pathname !== "/doctors/";

  if (isPortal) {
    return (
      <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-[var(--site-ink)] selection:bg-[var(--site-gold)]/30 selection:text-white">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#0B1630]/98 border-b border-[var(--site-gold)]/20 shadow-xl backdrop-blur-xl"
            : "bg-[#0B1630] border-b border-white/10 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          <Link
            to="/"
            className="flex items-center gap-3 group shrink-0 rounded-lg focus-visible:outline-none"
            aria-label={`${LAW_FIRM.name} — Home`}
          >
            <span className="h-10 w-10 rounded-md bg-[#1f3d5a] text-[var(--site-gold-light)] grid place-items-center ring-1 ring-[var(--site-gold)]/30 group-hover:bg-[#274c6e] transition-colors duration-200">
              <Scale className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[1.08rem] font-semibold tracking-tight text-white">
                {LAW_FIRM.name}
              </span>
              <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--site-gold)]">
                Advocates & Legal Consultants
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{
                  className: "text-white after:scale-x-100 after:opacity-100",
                }}
                inactiveProps={{
                  className: "text-slate-400 hover:text-white after:scale-x-0 after:opacity-0 hover:after:scale-x-100 hover:after:opacity-60",
                }}
                className="relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-[var(--site-gold)] after:transition-all after:duration-200"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${contactNumber}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
              aria-label={`Call ${LAW_FIRM.name} chambers at ${LAW_FIRM.phone}`}
            >
              <Phone className="h-3.5 w-3.5 text-[var(--site-gold)]" aria-hidden="true" />
              <span className="text-[0.82rem]">{LAW_FIRM.phone}</span>
            </a>
            <Button
              asChild
              size="sm"
              className="h-10 rounded-full bg-white px-5 text-[0.84rem] font-semibold text-[#07162C] shadow-sm transition-all duration-200 hover:bg-slate-100 border border-slate-200/40"
            >
              <Link to="/appointment" className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#07162C]" aria-hidden="true" />
                Book Consultation
              </Link>
            </Button>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg border border-white/[0.08] text-slate-200 hover:bg-white/[0.05] transition-colors duration-200"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div
            id="mobile-nav"
            className="lg:hidden border-t border-[var(--site-border)] bg-[#08090d]/98 backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-5 space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{
                    className: "text-white bg-white/[0.05] border-l-2 border-[var(--site-gold)] font-semibold",
                  }}
                  inactiveProps={{
                    className: "text-slate-300 hover:text-white hover:bg-white/[0.04] border-l-2 border-transparent",
                  }}
                  className="block min-h-12 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-150"
                >
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="px-4 pb-5 space-y-3 border-t border-white/[0.06] pt-4">
              <a
                href={`tel:${contactNumber}`}
                className="flex min-h-12 items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] text-slate-200 text-sm font-medium"
              >
                <Phone className="h-4 w-4 text-[var(--site-gold)] shrink-0" aria-hidden="true" />
                {LAW_FIRM.phone}
              </a>
              <a
                href={`https://wa.me/${LAW_FIRM.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] text-slate-200 text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                WhatsApp Chambers
              </a>
              <Button
                asChild
                className="w-full min-h-12 bg-[#1f3d5a] hover:bg-[#274c6e] text-white font-semibold py-3 h-auto text-base rounded-lg"
              >
                <Link to="/appointment">Book Consultation</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {!isPortal && (
        <section
          aria-labelledby="legal-services-directory"
          className="border-t border-slate-200 bg-[#F1F5F9]"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow border-slate-300 bg-white text-slate-700 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  Legal services directory
                </p>
                <h2
                  id="legal-services-directory"
                  className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
                >
                  Find the right practice area quickly.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-600">
                Browse every available legal service in a compact, easy-to-scan grid and open the
                dedicated service page for full details and associated lawyers.
              </p>
            </div>

            <div className="mt-8">
              {sectionsLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-24 rounded-2xl border border-slate-200 bg-white"
                    />
                  ))}
                </div>
              ) : sectionBlocks.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sectionBlocks.map(({ section, slug, summary, Icon }) => (
                    <Link
                      key={section.id}
                      to="/services/$serviceSlug"
                      params={{ serviceSlug: slug }}
                      className={cn(
                        "group flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                      )}
                      aria-label={`Open ${section.name} section page`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
                          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="mt-4 min-w-0">
                        <h3 className="font-serif text-base font-semibold leading-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600">
                          {section.name}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-6 text-slate-600">
                          {summary || "Open the dedicated section page for the full description."}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-600">
                  Legal service sections are not available at the moment.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="relative overflow-hidden bg-[#111827] text-slate-300 border-t border-slate-800">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="relative border-b border-slate-800 bg-[#111827]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Confidential legal counsel
              </span>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Speak with an advocate about your matter.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 max-w-xl">
                Book a consultation for a focused review of your documents, options, and next
                procedural steps — with client confidentiality as the starting point.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <a
                href={`tel:${contactNumber}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:border-[var(--site-gold)]/40"
              >
                <Phone className="h-4 w-4 text-[var(--site-gold)]" aria-hidden="true" />
                Call Chambers
              </a>
              <Link
                to="/appointment"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1f3d5a] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#274c6e]"
              >
                Book Consultation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.9fr_1.2fr]">
            <div className="min-w-0">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#1f3d5a] text-[var(--site-gold-light)] ring-1 ring-[var(--site-gold)]/30">
                  <Scale className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-base font-semibold text-white leading-tight">
                    {LAW_FIRM.name}
                  </span>
                  <span className="mt-0.5 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--site-gold)]">
                    {LAW_FIRM.specialization}
                  </span>
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-[0.86rem] leading-6 text-slate-500">
                {LAW_FIRM.tagline}. Counsel and representation across India’s courts and tribunals,
                handled with professional care.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[0.72rem] font-medium text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-[var(--site-gold)]" aria-hidden="true" />
                  Privileged communications
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[0.72rem] font-medium text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-[var(--site-gold)]" aria-hidden="true" />
                  Direct advocate access
                </span>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Follow the firm
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
                          aria-label={`Follow ${LAW_FIRM.name} on ${social.label}`}
                          className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-400 transition-colors duration-200 hover:border-[var(--site-gold)]/40 hover:text-white"
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                Explore
              </h2>
              <ul className="mt-5 space-y-2 text-[0.88rem]">
                {nav.map((n) => (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className="group inline-flex min-h-10 items-center gap-2 text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      <ArrowRight className="h-3 w-3 text-[var(--site-gold)]/70 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                For clients
              </h2>
              <ul className="mt-5 space-y-2 text-[0.88rem]">
                {clientLinks.map((n) => (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className="group inline-flex min-h-10 items-center gap-2 text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      <ArrowRight className="h-3 w-3 text-[var(--site-gold)]/70 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                Chambers
              </h2>
              <ul className="mt-5 space-y-4 text-[0.88rem]">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-gold)]" aria-hidden="true" />
                  <span className="min-w-0 text-slate-400 break-words">{LAW_FIRM.address}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-gold)]" aria-hidden="true" />
                  <span className="min-w-0 space-y-1.5">
                    <a
                      href={`tel:${contactNumber}`}
                      className="block font-semibold text-slate-200 transition-colors hover:text-white"
                    >
                      {LAW_FIRM.phone}
                    </a>
                    <a
                      href={`tel:${emergencyNumber}`}
                      className="block text-[0.76rem] text-slate-500 transition-colors hover:text-[var(--site-gold)]"
                    >
                      Urgent: {LAW_FIRM.emergencyPhone}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-gold)]" aria-hidden="true" />
                  <a
                    href={`mailto:${LAW_FIRM.email}`}
                    className="min-w-0 break-all text-slate-400 transition-colors hover:text-white"
                  >
                    {LAW_FIRM.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-gold)]" aria-hidden="true" />
                  <span className="min-w-0 text-slate-400">
                    {LAW_FIRM.workingDays}
                    <br />
                    <span className="text-slate-300 font-medium">{LAW_FIRM.workingHours}</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.05]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[0.75rem] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>
              © {new Date().getFullYear()} {LAW_FIRM.name}. All rights reserved.
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <span>Professional communications are confidential</span>
              <Link
                to="/admin"
                className="text-slate-600 transition-colors hover:text-slate-400"
              >
                Staff & Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {!isLawyerProfile && (
        <a
          href={`https://wa.me/${LAW_FIRM.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`WhatsApp ${LAW_FIRM.name} chambers`}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-2xl shadow-black/40 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none"
        >
          <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" aria-hidden>
            <path d="M19.11 17.21c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.89 0-10.67 4.78-10.67 10.67 0 1.88.49 3.71 1.42 5.32L5.33 26.67l5.51-1.44a10.6 10.6 0 0 0 5.18 1.32h.01c5.88 0 10.66-4.78 10.66-10.67 0-2.85-1.11-5.53-3.12-7.55a10.6 10.6 0 0 0-7.55-3z" />
          </svg>
        </a>
      )}
    </div>
  );
}
