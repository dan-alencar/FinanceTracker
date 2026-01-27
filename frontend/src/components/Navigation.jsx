import { NavLink } from "react-router-dom";
import "../styles/navigation.css";

const links = [
  { to: "/", label: "Guild Hall" },
  { to: "/onboarding", label: "Initiation" },
  { to: "/transactions", label: "Coin Ledger" },
  { to: "/missions", label: "Contracts" },
  { to: "/budgets", label: "Monthly Quests" },
  { to: "/shop", label: "Armory" },
  { to: "/insights", label: "Forge Insights" },
  { to: "/achievements", label: "Achievements" },
  { to: "/inbox", label: "Raven Post" },
  { to: "/admin", label: "War Room" }
];

export default function Navigation() {
  return (
    <nav className="nav">
      <div className="nav-brand">Dwarven Guild</div>
      <div className="nav-links">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="nav-link">
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
