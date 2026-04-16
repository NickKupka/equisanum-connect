import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string, googleMeta?: { full_name?: string; avatar_url?: string; email?: string }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // If Google login metadata is available, sync missing fields only
    if (googleMeta?.full_name) {
      const parts = googleMeta.full_name.trim().split(" ");
      const first_name = parts[0] ?? "";
      const last_name = parts.slice(1).join(" ") || null;
      const updates: { first_name?: string; last_name?: string | null; avatar_url?: string; email?: string } = {};
      if (!profile?.first_name) updates.first_name = first_name;
      if (!profile?.last_name) updates.last_name = last_name;
      if (!profile?.avatar_url && googleMeta.avatar_url) updates.avatar_url = googleMeta.avatar_url;
      if (googleMeta.email) updates.email = googleMeta.email;
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("user_id", userId);
        // Re-fetch after update
        const { data: updated } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
        const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
        setState((prev) => ({ ...prev, profile: updated as Profile | null, isAdmin, loading: false }));
        return;
      }
    }

    // Always update state with freshly loaded profile
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r) => r.role === "admin") ?? false;

    setState((prev) => ({
      ...prev,
      profile: profile as Profile | null,
      isAdmin,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          session,
        }));

        if (session?.user) {
          const meta = session.user.user_metadata;
          // Defer profile fetch to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id, {
            full_name: meta?.full_name,
            avatar_url: meta?.avatar_url,
            email: session.user.email,
          }), 0);
        } else {
          setState((prev) => ({
            ...prev,
            profile: null,
            isAdmin: false,
            loading: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
      }));
      if (session?.user) {
        const meta = session.user.user_metadata;
        fetchProfile(session.user.id, {
          full_name: meta?.full_name,
          avatar_url: meta?.avatar_url,
          email: session.user.email,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      isAdmin: false,
      loading: false,
    });
  }, []);

  const refetchProfile = useCallback(() => {
    if (state.user) return fetchProfile(state.user.id);
  }, [state.user, fetchProfile]);

  return { ...state, signOut, refetchProfile };
}
