import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/images/logo.png";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Seite nicht gefunden
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Die Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EquiSanum – Bewegungstherapie & Pferdetherapie" },
      { name: "description", content: "Die Praxis-App von Laura Kupka – Bewegungstherapeutin & Pferdetherapeutin aus Wolfersdorf bei Freising" },
      { name: "author", content: "EquiSanum" },
      { property: "og:title", content: "EquiSanum – Bewegungstherapie & Pferdetherapie" },
      { property: "og:description", content: "Die Praxis-App von Laura Kupka – Bewegungstherapeutin & Pferdetherapeutin" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@EquiSanum" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/favicon.png",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
        {/* Apply saved dark mode preference before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');})();` }} />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/onboarding";

  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthPage) {
      navigate({ to: "/login" });
    } else if (user && !profile) {
      // Profile not loaded yet – wait (useEffect will re-run when profile loads)
      return;
    } else if (user && profile && !profile.onboarding_complete && location.pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
    } else if (user && profile?.onboarding_complete && isAuthPage) {
      navigate({ to: "/" });
    }
  }, [user, profile, loading, location.pathname, isAuthPage, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
            <img src={logo} alt="EquiSanum" className="h-full w-full object-cover" />
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Auth pages render without the app layout
  if (isAuthPage) {
    return <Outlet />;
  }

  // Authenticated pages render with the app layout
  return <AppLayout />;
}
