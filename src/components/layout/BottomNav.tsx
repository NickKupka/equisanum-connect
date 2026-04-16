import { Link, useLocation } from "@tanstack/react-router";
import { Home, BookOpen, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom horse head SVG icon as a React component
function HorseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3c1 0 2 .5 2.5 1.5l1 2.5c.3.8-.2 1.5-1 1.5h-1L17 11l-1 3-2 3H9l-1-3c-1-2-2-4-2-6 0-3 2-5 5-5h2" />
      <path d="M14 7.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5.2-.5.5-.5.5.2.5.5z" fill="currentColor" />
      <path d="M9 17v3M13 17v3" />
    </svg>
  );
}

const navItems = [
  { to: "/" as const, icon: Home, label: "Home", matchPrefix: false },
  { to: "/journal" as const, icon: BookOpen, label: "Tagebuch", matchPrefix: true },
  { to: "/horse" as const, icon: null, label: "Mein Pferd", matchPrefix: true, customIcon: true },
  { to: "/community" as const, icon: MessageCircle, label: "Community", matchPrefix: true },
  { to: "/profile" as const, icon: User, label: "Profil", matchPrefix: true },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/15 glass-panel">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = item.matchPrefix
            ? location.pathname.startsWith(item.to)
            : location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 touch-target transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.customIcon ? (
                <HorseIcon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              ) : Icon ? (
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              ) : null}
              <span className="text-[0.65rem] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
