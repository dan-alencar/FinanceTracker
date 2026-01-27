import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "../components/Card";
import { supabase } from "../lib/supabaseClient";
import { useGameStore } from "../store/useGameStore";

const getPostLoginRoute = (profile) =>
  profile?.displayName && profile?.classId ? "/dashboard" : "/onboarding";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useGameStore();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        navigate(getPostLoginRoute(profile), { replace: true });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          navigate(getPostLoginRoute(profile), { replace: true });
        }
      }
    );

    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [navigate, profile]);

  const handleGoogle = async () => {
    setError("");
    setStatus("");
    localStorage.removeItem("dg_demo");
    if (!supabase) {
      setError(t("login.missingSupabase"));
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
    if (signInError) {
      setError(t("login.error"));
    }
  };

  const handleMagicLink = async () => {
    setError("");
    setStatus("");
    localStorage.removeItem("dg_demo");
    if (!supabase) {
      setError(t("login.missingSupabase"));
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (signInError) {
      setError(t("login.error"));
      return;
    }
    setStatus(t("login.success"));
  };

  const handleDemo = () => {
    localStorage.setItem("dg_demo", "true");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <span className="badge">MVP</span>
        <h1 className="page-title">{t("login.title")}</h1>
        <p className="subtitle">{t("login.subtitle")}</p>
      </div>

      <div className="grid grid-2 login-grid">
        <Card title={t("login.title")} subtitle={t("login.subtitle")}>
          <div className="login-actions">
            <button className="button" onClick={handleGoogle}>
              {t("login.google")}
            </button>
            <div className="login-divider">{t("login.or")}</div>
            <label className="tag" htmlFor="login-email">
              {t("login.emailLabel")}
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="hero@guild.com"
            />
            <button className="button secondary" onClick={handleMagicLink}>
              {t("login.sendLink")}
            </button>
            <button className="button ghost" onClick={handleDemo}>
              {t("login.demo")}
            </button>
            {status && <div className="badge success">{status}</div>}
            {error && <div className="badge error">{error}</div>}
          </div>
        </Card>

        <Card title={t("login.pitchTitle")} subtitle={t("login.pitchSubtitle")}>
          <ul className="login-list">
            <li>{t("login.pitchBulletOne")}</li>
            <li>{t("login.pitchBulletTwo")}</li>
            <li>{t("login.pitchBulletThree")}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
