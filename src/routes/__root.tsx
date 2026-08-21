import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteLayout } from "@/components/SiteLayout";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 bg-[#08090d] text-slate-100">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl font-semibold text-[var(--site-gold)]">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-white">Page not found</h2>
        <p className="mt-2 text-sm text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1f3d5a] px-4 text-sm font-medium text-white hover:bg-[#274c6e]"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 bg-[#08090d] text-slate-100">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl font-semibold text-white">This page didn't load</h1>
        <p className="mt-2 text-sm text-slate-400">
          Something went wrong. Try again or head home.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="min-h-11 rounded-lg bg-[#1f3d5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#274c6e]"
          >
            Try again
          </button>
          <a
            href="/"
            className="min-h-11 rounded-lg border border-white/12 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.05]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sharma & Associates — Trusted Legal Counsel" },
      {
        name: "description",
        content:
          "Sharma & Associates provides expert legal representation and trusted counsel. Consult experienced lawyers for your legal needs.",
      },
      { property: "og:title", content: "Sharma & Associates — Trusted Legal Counsel" },
      {
        property: "og:description",
        content:
          "Sharma & Associates provides expert legal representation and trusted counsel. Consult experienced lawyers for your legal needs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sharma & Associates — Trusted Legal Counsel" },
      {
        name: "twitter:description",
        content:
          "Sharma & Associates provides expert legal representation and trusted counsel. Consult experienced lawyers for your legal needs.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,600&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AuthProvider } from "@/components/AuthProvider";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteLayout />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
