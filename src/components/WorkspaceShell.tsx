import { useState } from "react";
import { Bell, Heart, LayoutDashboard, LocateFixed, LogOut, MapPinned, Menu, Search, Users, X } from "lucide-react";
import type { ReactNode } from "react";

export type WorkspacePage = "dashboard" | "children" | "reminders" | "transfer" | "clinics";

interface WorkspaceShellProps {
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
  onLogout: () => void;
  onRegister: () => void;
  onSearch: (value: string) => void;
  reminderCount: number;
  search: string;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ id: WorkspacePage; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "children", label: "Children", icon: Users },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "transfer", label: "Transfer record", icon: MapPinned },
  { id: "clinics", label: "Find Nearby Clinics", icon: LocateFixed },
];

export default function WorkspaceShell({
  activePage,
  onNavigate,
  onLogout,
  onRegister,
  onSearch,
  reminderCount,
  search,
  children,
}: WorkspaceShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(page: WorkspacePage) {
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <div className="workspace">
      <aside aria-label="Main navigation" className={`sidebar${menuOpen ? " mobile-open" : ""}`}>
        <a className="workspace-brand" href="#dashboard" onClick={(event) => { event.preventDefault(); navigate("dashboard"); }}>
          <span className="brand-mark"><Heart aria-hidden="true" fill="currentColor" size={17} /></span>
          <span>Kavach</span>
        </a>
        <span className="nav-caption">CARE SPACE</span>
        <nav className="side-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={activePage === id ? "page" : undefined}
              className={`nav-link${activePage === id ? " nav-active" : ""}`}
              key={id}
              onClick={() => navigate(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
              {id === "reminders" && reminderCount > 0 && <span className="nav-count">{reminderCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="worker-profile">
          <span className="worker-avatar">AS</span>
          <span className="worker-info"><strong>Anita Sharma</strong><small>Health worker · ANM-1042</small></span>
          <button aria-label="Sign out" className="logout-button" onClick={onLogout} title="Sign out" type="button"><LogOut size={16} /></button>
        </div>
      </aside>
      {menuOpen && <button aria-label="Close menu" className="mobile-scrim" onClick={() => setMenuOpen(false)} type="button" />}
      <div className="workspace-main">
        <header className="topbar">
          <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} type="button">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-context"><span className="context-label">COMMUNITY HEALTH</span><strong>Andhra Pradesh <span>·</span> Annamayya</strong></div>
          <label className="search-field">
            <Search aria-hidden="true" size={17} />
            <input aria-label="Search children by name or ID" onChange={(event) => onSearch(event.target.value)} placeholder="Search name or child ID" value={search} />
            <kbd>⌘ K</kbd>
          </label>
          <button aria-label={`View reminders${reminderCount ? `, ${reminderCount} sent` : ""}`} className="notification-button" onClick={() => navigate("reminders")} type="button">
            <Bell aria-hidden="true" size={19} />
            {reminderCount > 0 && <span />}
          </button>
          <button className="top-register-button" onClick={onRegister} type="button"><span>+</span> Register child</button>
        </header>
        <main className="workspace-content">{children}</main>
        <nav aria-label="Mobile navigation" className="mobile-bottom-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button aria-current={activePage === id ? "page" : undefined} className={activePage === id ? "mobile-nav-active" : ""} key={id} onClick={() => navigate(id)} type="button">
              <Icon size={19} aria-hidden="true" /><span>{id === "transfer" ? "Transfer" : id === "clinics" ? "Clinics" : label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
