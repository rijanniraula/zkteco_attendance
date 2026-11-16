import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  CalendarTick,
  Category,
  CloseCircle,
  HamburgerMenu,
  Key,
  LogoutCurve,
  People,
  Setting2,
  TaskSquare,
} from "iconsax-reactjs";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: Category, end: true },
  { to: "/admin/attendance", label: "Attendance", icon: TaskSquare },
  { to: "/admin/users", label: "Users", icon: People },
  { to: "/admin/holidays", label: "Holidays", icon: Calendar },
];

const EMPLOYEE_LINKS = [{ to: "/my-attendance", label: "My attendance", icon: CalendarTick }];

// Square app mark: calendar with a tick
export const BrandMark = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="var(--primary)" />
    <rect x="8" y="9" width="16" height="15" rx="3" fill="none" stroke="#fff" strokeWidth="2" />
    <path d="M12 7v4M20 7v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M12.5 17l2.3 2.3 4.7-4.6" fill="none" stroke="#fff" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NavItem = ({ to, label, icon, end, onNavigate }) => {
  const Icon = icon;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(61_58_242/0.3)]"
            : "text-foreground/75 hover:bg-accent hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} variant={isActive ? "Bold" : "Linear"} />
          {label}
        </>
      )}
    </NavLink>
  );
};

const SidebarContent = ({ onNavigate }) => {
  const { isAdmin, logout } = useAuth();
  const links = isAdmin ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <div className="flex h-full flex-col px-3">
      <div className="flex items-center gap-2.5 px-2 pt-6 pb-7">
        <BrandMark className="size-8" />
        <span className="font-brand text-[22px] leading-none">Attendance</span>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavItem key={link.to} {...link} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border py-4">
        {isAdmin && <NavItem to="/admin/settings" label="Settings" icon={Setting2} onNavigate={onNavigate} />}
        <NavItem to="/change-password" label="Change password" icon={Key} onNavigate={onNavigate} />
        <button
          type="button"
          onClick={logout}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/75 transition-colors hover:bg-absent-bg/50 hover:text-absent"
        >
          <LogoutCurve size={18} />
          Log out
        </button>
      </div>
    </div>
  );
};

const AppLayout = () => {
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#18181b]/30"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card shadow-xl animate-in slide-in-from-left">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-6 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <CloseCircle size={22} />
            </button>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur md:px-8">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="-ml-1 cursor-pointer rounded-lg p-1.5 text-foreground/80 hover:bg-accent lg:hidden"
          aria-label="Open menu"
        >
          <HamburgerMenu size={20} />
        </button>
        <span className="font-brand text-lg lg:hidden">Attendance</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium">{user?.name}</div>
            <div className="text-[11px] text-muted-foreground">{isAdmin ? "Super admin" : "Employee"}</div>
          </div>
          <Avatar name={user?.name} />
        </div>
      </header>

      <main className="px-4 py-6 md:px-8 md:py-8 space-y-6">
        <Outlet />
      </main>
    </div>
  );
};

// Page heading: date line, large title, optional description, actions on the right
export const PageTitle = ({ eyebrow, title, description, children }) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="space-y-1">
      <div className="text-[13px] text-muted-foreground">{eyebrow || format(new Date(), "EEEE, do MMMM")}</div>
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
      {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </header>
);

export default AppLayout;
