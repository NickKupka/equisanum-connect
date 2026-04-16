import { Bell, Settings, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import logo from "@/images/logo.png";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: { post_id?: string; comment_id?: string } | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `Vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Gestern";
  return `Vor ${days} Tagen`;
}

export function AppHeader() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reload when dropdown opens
  useEffect(() => {
    if (notifOpen) loadNotifications();
  }, [notifOpen, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    setNotifOpen(false);
    if (n.type === "comment" && n.data?.post_id) {
      navigate({ to: "/community" });
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 glass-panel">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary overflow-hidden">
            <img src={logo} alt="EquiSanum Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            EquiSanum
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center justify-center rounded-full p-2 touch-target",
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={cn(
                "relative flex items-center justify-center rounded-full p-2 touch-target",
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[0.55rem] font-bold text-accent-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl glass-modal p-0 shadow-xl z-50">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h3 className="text-sm font-bold text-white">Benachrichtigungen</h3>
                  <button onClick={() => setNotifOpen(false)} className="rounded-full p-1 hover:bg-white/10">
                    <X className="h-4 w-4 text-white/50" />
                  </button>
                </div>
                <div className="px-3 pb-3 space-y-1 max-h-80 overflow-y-auto">
                  {loading && (
                    <div className="py-4 flex justify-center">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                  {!loading && notifications.length === 0 && (
                    <p className="text-center text-xs text-white/30 py-4">Keine Benachrichtigungen</p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-white/5",
                        !n.is_read && "bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs",
                        n.type === "comment" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent-foreground"
                      )}>
                        {n.type === "comment" ? "💬" : "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold", n.is_read ? "text-white/60" : "text-white")}>{n.title}</p>
                        {n.body && <p className="text-[0.7rem] text-white/50 line-clamp-2 mt-0.5">{n.body}</p>}
                        <p className="text-[0.6rem] text-white/30 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
