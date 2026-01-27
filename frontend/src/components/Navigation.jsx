import { NavLink } from "react-router-dom";
import "../styles/navigation.css";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/transactions", label: "Log" },
  { to: "/missions", label: "Missions" },
  { to: "/shop", label: "Shop" },
  { to: "/inbox", label: "Inbox" },
  { to: "/admin", label: "Counselor Admin" }
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
