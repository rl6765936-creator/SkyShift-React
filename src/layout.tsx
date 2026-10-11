import { LanguageSwitch, useI18n } from "./i18n";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Car,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  PlusCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "./auth";
import { Brand } from "./components";
const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vehicles", label: "Available vehicles", icon: Car },
  { to: "/my-vehicle", label: "My vehicle", icon: Plane },
  { to: "/record-flight", label: "Record a flight", icon: PlusCircle },
];
const managerLinks = [
  { to: "/manager", label: "Manager dashboard", icon: LayoutDashboard },
  { to: "/manager/vehicles", label: "Vehicles", icon: Car },
  { to: "/manager/users", label: "Users", icon: Users },
  { to: "/manager/flights", label: "Flights", icon: Plane },
  { to: "/manager/assignments", label: "Assignments", icon: ClipboardList },
];
export const Layout = ({ manager = false }: { manager?: boolean }) => {
  const { t, language } = useI18n();
  void language;

  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = manager ? managerLinks : userLinks;
  return (
    <div className="app-layout">
      <a href="#main" className="skip-link">
        {t("Skip to content")}
      </a>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label={t("Close navigation")}
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <span className="nav-label">
          {manager ? t("Fleet workspace") : t("Your flight space")}
        </span>
        <nav aria-label={t("Main navigation")}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/manager"}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} strokeWidth={1.5} />
              {t(label)}
            </NavLink>
          ))}
        </nav>
        {session?.role === "Manager" && (
          <NavLink
            className="workspace-switch"
            to={manager ? "/dashboard" : "/manager"}
            onClick={() => setOpen(false)}
          >
            <ArrowUpRight size={16} />
            {manager ? t("Personal workspace") : t("Manager workspace")}
          </NavLink>
        )}
        <div className="sidebar-bottom">
          <LanguageSwitch />
          <div className="sidebar-sky">
            <Plane size={22} />
            <strong>{t("A new perspective.")}</strong>
            <p>{t("A little closer to the sky.")}</p>
          </div>
          <button
            className="logout"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            <LogOut size={18} />
            {t("Sign out")}
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="nav-backdrop"
          aria-label={t("Close navigation")}
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label={t("Open navigation")}
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <span className="topbar-title">
            {manager
              ? t("SkyShift / Management")
              : t("SkyShift / Personal workspace")}
          </span>
          <button className="logout topbar-logout" onClick={() => { signOut(); setOpen(false); navigate("/login", { replace: true }); }}><LogOut size={18} /><span>{t("Sign out")}</span></button>
          <div className="identity">
            <span className="avatar">
              {session?.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{session?.name}</strong>
              <small>
                {session?.role === "Manager"
                  ? t("System manager")
                  : t("SkyShift participant")}
              </small>
            </div>
          </div>
        </header>
        <main id="main">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>SkyShift</span>
          <span>{t("Fly further. Feel lighter.")}</span>
        </footer>
      </div>
    </div>
  );
};
