import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useGameStore } from "../store/useGameStore";

const isProfileComplete = (profile) => Boolean(profile?.displayName && profile?.classId);

export default function ProtectedRoute() {
  const location = useLocation();
  const { profile } = useGameStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const demoEnabled = localStorage.getItem("dg_demo") === "true";

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) {
    return <div style={{ padding: "32px" }}>Loading...</div>;
  }

  if (!demoEnabled && !session && supabase) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isProfileComplete(profile) && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
