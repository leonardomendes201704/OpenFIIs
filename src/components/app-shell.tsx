"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Gift,
  Grid2X2,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Menu,
  Search,
  Settings,
  X
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Carteira", icon: Briefcase, href: "/carteira" },
  { label: "Simulações", icon: LineChart, href: "/simulacoes" },
  { label: "Projeções", icon: BarChart3, href: "/projecoes" },
  { label: "Dividendos", icon: Grid2X2, href: "/dividendos" },
  { label: "FIIs", icon: Building2, href: "/fiis" },
  { label: "Relatórios", icon: ClipboardList, href: "/relatorios" },
  { label: "Configurações", icon: Settings, href: "/configuracoes" }
];

function AppLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="brand" aria-label="OpenFIIs">
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      {!collapsed && <strong>OpenFIIs</strong>}
    </div>
  );
}

export function AppShell({
  children,
  searchPlaceholder = "Buscar FIIs, relatórios, simuladores..."
}: {
  children: ReactNode;
  searchPlaceholder?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}

      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-top">
          <AppLogo collapsed={collapsed} />
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map((item) => {
            const isActive = item.href === pathname;

            return (
              <Link className={`nav-item ${isActive ? "active" : ""}`} href={item.href} key={item.label} title={collapsed ? item.label : undefined}>
                <item.icon size={21} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="invite-card">
          <div>
            <strong>Indique e ganhe</strong>
            <p>Convide amigos e ganhe benefícios exclusivos.</p>
            <button>Convidar agora</button>
          </div>
          <Gift size={31} />
        </div>

        <button className="collapse-button" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          <span>Recolher menu</span>
        </button>
      </aside>

      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
          <Menu size={20} />
        </button>

        <label className="search-box">
          <Search size={20} />
          <input placeholder={searchPlaceholder} />
          <kbd>⌘ K</kbd>
        </label>

        <div className="topbar-actions">
          <button className="date-range">
            01/01/2024 - 31/05/2024
            <CalendarDays size={18} />
          </button>
          <button className="icon-button" aria-label="Ajuda"><HelpCircle size={19} /></button>
          <button className="icon-button notify" aria-label="Notificações">
            <Bell size={19} />
            <span>3</span>
          </button>
          <button className="profile-button">
            <span>CS</span>
            <div>
              <strong>Carlos Silva</strong>
              <small>Perfil Investidor</small>
            </div>
            <ChevronDown size={16} />
          </button>
        </div>
      </header>

      {children}

      <footer className="footer">
        <span>© 2024 OpenFIIs. Todos os direitos reservados.</span>
        <div>
          <span>Dados de mercado por</span>
          <strong>QUANTWISE</strong>
        </div>
        <a>Termos de uso</a>
        <a>Política de privacidade</a>
      </footer>
    </div>
  );
}
