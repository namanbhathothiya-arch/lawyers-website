import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { LAW_FIRM } from "@/lib/clinic-data";
import { Button } from "@/components/ui/button";

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
  { to: "/gallery", label: "Firm Gallery" },
  { to: "/contact", label: "Get Directions" },
] as const;

const contactNumber = LAW_FIRM.phone.replace(/[^\d+]/g, "");
const emergencyNumber = LAW_FIRM.emergencyPhone.replace(/[^\d+]/g, "");

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
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

  if (isPortal) {
    return (
      <div className="min-h-screen bg-[#070c14] text-slate-100 flex flex-col">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070c14] text-slate-100 selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070c14]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="h-9 w-9 rounded-lg bg-blue-600 text-white grid place-items-center shadow-md shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
              <Scale className="h-5 w-5" />
            </span>
            <span className="font-serif font-bold text-lg sm:text-xl leading-tight tracking-tight text-white">
              {LAW_FIRM.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "text-blue-400 bg-blue-950/50 border border-blue-800/40" }}
                inactiveProps={{
                  className: "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent",
                }}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a
              href={`tel:${LAW_FIRM.phone}`}
              className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Phone className="h-4 w-4 text-blue-500" /> {LAW_FIRM.phone}
            </a>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-900/40 rounded-lg px-4">
              <Link to="/appointment">Book a Meeting</Link>
            </Button>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-800"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-slate-800 bg-[#070c14]/98 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1.5">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{ className: "text-blue-400 bg-blue-950/60 font-semibold" }}
                  inactiveProps={{ className: "text-slate-300 hover:bg-slate-800/60" }}
                  className="block px-3.5 py-3 rounded-lg text-base font-medium transition-colors"
                >
                  {n.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-800 mt-2 space-y-3">
                <a
                  href={`tel:${LAW_FIRM.phone}`}
                  className="flex items-center justify-center gap-2 py-2 text-sm text-slate-300"
                >
                  <Phone className="h-4 w-4 text-blue-500" /> {LAW_FIRM.phone}
                </a>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5" onClick={() => setOpen(false)}>
                  <Link to="/appointment">Book a Meeting</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="relative mt-20 overflow-hidden border-t border-slate-800 bg-[#040810] text-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_32rem)]" />
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-600/50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Premium Legal Services
              </span>
              <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Need expert legal representation?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                Our advocates provide strategic legal solutions and confidential consultation for corporate, civil, and criminal matters across India.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[22rem]">
              <a
                href={`tel:${contactNumber}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 hover:border-slate-600"
              >
                <Phone className="h-4 w-4 text-blue-400" />
                Call Firm
              </a>
              <Link
                to="/appointment"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950 transition hover:bg-blue-500"
              >
                Book Consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.15fr]">
            <div className="min-w-0">
              <Link to="/" className="inline-flex max-w-full items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-900/40">
                  <Scale className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block break-words font-serif text-lg font-bold leading-tight text-white">
                    {LAW_FIRM.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-widest text-amber-500/90">
                    {LAW_FIRM.specialization}
                  </span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">{LAW_FIRM.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  Bar Council Compliant
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  Confidential & Strategic
                </span>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Follow Firm
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
                          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
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
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Quick Links
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                {nav.map((n) => (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className="group inline-flex items-center gap-2 transition hover:text-white"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Client Portal
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                {clientLinks.map((n) => (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className="group inline-flex items-center gap-2 transition hover:text-white"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Chambers Location
              </h4>
              <ul className="mt-4 space-y-3.5 text-sm text-slate-400">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="min-w-0 break-words">{LAW_FIRM.address}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="min-w-0 space-y-1">
                    <a
                      href={`tel:${contactNumber}`}
                      className="block break-words transition hover:text-white font-medium"
                    >
                      {LAW_FIRM.phone}
                    </a>
                    <a
                      href={`tel:${emergencyNumber}`}
                      className="block break-words text-xs text-slate-400 transition hover:text-amber-400"
                    >
                      Urgent Helpline: {LAW_FIRM.emergencyPhone}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <a
                    href={`mailto:${LAW_FIRM.email}`}
                    className="min-w-0 break-all transition hover:text-white"
                  >
                    {LAW_FIRM.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="min-w-0 break-words">
                    {LAW_FIRM.workingDays}
                    <br />
                    {LAW_FIRM.workingHours}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative border-t border-slate-800/80 bg-[#02050b]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>
              © {new Date().getFullYear()} {LAW_FIRM.name}. All rights reserved. Professional Legal Practice.
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>Bar Council of India Regulations Compliant</span>
              <Link to="/admin" className="transition hover:text-slate-300">
                Staff & Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${LAW_FIRM.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 h-13 w-13 rounded-full bg-[#25D366] text-white grid place-items-center shadow-xl shadow-green-950/50 hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" aria-hidden>
          <path d="M19.11 17.21c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM16.02 5.33c-5.89 0-10.67 4.78-10.67 10.67 0 1.88.49 3.71 1.42 5.32L5.33 26.67l5.51-1.44a10.6 10.6 0 0 0 5.18 1.32h.01c5.88 0 10.66-4.78 10.66-10.67 0-2.85-1.11-5.53-3.12-7.55a10.6 10.6 0 0 0-7.55-3z" />
        </svg>
      </a>
    </div>
  );
}
