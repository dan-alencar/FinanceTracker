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
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");

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

  const handleAuth = async () => {
    setError("");
    setStatus("");
    localStorage.removeItem("dg_demo");
    if (!supabase) {
      if (!email || !password) {
        setError(t("login.missingFields"));
        return;
      }
      const stored = JSON.parse(localStorage.getItem("dg_demo_users") || "[]");
      const existing = stored.find((user) => user.email === email);
      if (mode === "signup") {
        if (existing) {
          setError(t("login.userExists"));
          return;
        }
        stored.push({ email, password });
        localStorage.setItem("dg_demo_users", JSON.stringify(stored));
      } else if (!existing || existing.password !== password) {
        setError(t("login.invalidCredentials"));
        return;
      }
      localStorage.setItem("dg_demo_user", email);
      localStorage.setItem("dg_demo", "true");
      setStatus(t("login.demoAuth"));
      navigate(getPostLoginRoute(profile), { replace: true });
      return;
    }
    if (!email || !password) {
      setError(t("login.missingFields"));
      return;
    }

    const authCall =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error: authError } = await authCall;
    if (authError) {
      setError(t("login.error"));
      return;
    }

    setStatus(mode === "signup" ? t("login.signupSuccess") : t("login.success"));
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
            <div className="toggle-group">
              <button
                type="button"
                className={mode === "login" ? "button" : "button secondary"}
                onClick={() => setMode("login")}
              >
                {t("login.signIn")}
              </button>
              <button
                type="button"
                className={mode === "signup" ? "button" : "button secondary"}
                onClick={() => setMode("signup")}
              >
                {t("login.signUp")}
              </button>
            </div>
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
            <label className="tag" htmlFor="login-password">
              {t("login.passwordLabel")}
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
            />
            <button className="button" onClick={handleAuth}>
              {mode === "signup" ? t("login.createAccount") : t("login.signIn")}
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
