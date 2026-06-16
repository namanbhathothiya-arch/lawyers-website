import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone, Stethoscope } from "lucide-react";
import { CLINIC } from "@/lib/clinic-data";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/doctors", label: "Doctors" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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

          <nav className="hidden md:flex items-center gap-1">
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

          <div className="hidden md:flex items-center gap-3">
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
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-md hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background">
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

      <footer className="mt-20 border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="font-display font-bold">{CLINIC.name}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">{CLINIC.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-foreground">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{CLINIC.address}</li>
              <li>
                <a href={`tel:${CLINIC.phone}`} className="hover:text-foreground">
                  {CLINIC.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CLINIC.email}`} className="hover:text-foreground">
                  {CLINIC.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {CLINIC.name}. All rights reserved.
          </span>
          <Link to="/admin" className="hover:text-foreground underline">
            Admin Portal
          </Link>
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
