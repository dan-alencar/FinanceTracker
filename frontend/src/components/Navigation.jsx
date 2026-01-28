import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";
import { supabase } from "../lib/supabaseClient";
import "../styles/navigation.css";

const links = [
  { to: "/", labelKey: "nav.guildHall" },
  { to: "/onboarding", labelKey: "nav.onboarding" },
  { to: "/transactions", labelKey: "nav.transactions" },
  { to: "/missions", labelKey: "nav.missions" },
  { to: "/budgets", labelKey: "nav.budgets" },
  { to: "/shop", labelKey: "nav.shop" },
  { to: "/insights", labelKey: "nav.insights" },
  { to: "/achievements", labelKey: "nav.achievements" },
  { to: "/inbox", labelKey: "nav.inbox" },
  { to: "/admin", labelKey: "nav.admin" }
];

export default function Navigation() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem("dg_demo");
    localStorage.removeItem("dg_demo_user");
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate("/login", { replace: true });
  };

  return (
    <nav className="nav">
      <div className="nav-left">
        <LanguageToggle />
        <div className="nav-brand">Dwarven Guild</div>
      </div>
      <div className="nav-links">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="nav-link">
            {t(link.labelKey)}
          </NavLink>
        ))}
        <button type="button" className="nav-link nav-logout" onClick={handleLogout}>
          {t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
