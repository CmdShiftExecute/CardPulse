"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  CalendarClock,
  BarChart3,
  Wallet,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Cards", href: "/cards", icon: CreditCard },
  { label: "EMIs", href: "/emis", icon: CalendarClock },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Budgets", href: "/budgets", icon: Wallet },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Bottom nav items on mobile — subset of most important */
const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Txns", href: "/transactions", icon: ArrowLeftRight },
  { label: "Cards", href: "/cards", icon: CreditCard },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "More", href: "/settings", icon: Settings },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // On tablet (md–lg), always show as icon-only
  const isIconOnly = collapsed;

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col border-r border-border bg-surface-1 transition-all duration-200",
        isIconOnly ? "w-sidebar-collapsed" : "w-sidebar",
        // Tablet (md to lg): always collapsed
        "max-lg:!w-sidebar-collapsed"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-border px-4 py-5",
          isIconOnly ? "justify-center" : "justify-between",
          "max-lg:justify-center"
        )}
      >
        {!isIconOnly && (
          <Link href="/dashboard" className="flex items-center gap-2 max-lg:hidden">
            <span className="text-xl font-bold text-sage-400">CardPulse</span>
          </Link>
        )}
        {/* Tablet: show abbreviated logo */}
        <Link href="/dashboard" className="hidden max-lg:block lg:hidden">
          <span className="text-lg font-bold text-sage-400">CP</span>
        </Link>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-button p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors max-lg:hidden"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isIconOnly && "justify-center px-2",
                    "max-lg:justify-center max-lg:px-2",
                    isActive
                      ? "bg-sage-400/15 text-sage-300"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
                  )}
                  title={isIconOnly ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon size={20} className="shrink-0" />
                  {!isIconOnly && <span className="max-lg:hidden">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 max-lg:hidden">
        {!isIconOnly && (
          <p className="text-xs text-text-muted">
            Feel your spending rhythm
          </p>
        )}
      </div>
    </aside>
  );
}

/** Mobile bottom navigation bar — visible only on small screens */
function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-border bg-surface-1/95 backdrop-blur-sm pb-safe">
      <ul className="flex items-center justify-around px-2 py-1.5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-button px-3 py-1.5 min-w-[52px] transition-all duration-150",
                  isActive
                    ? "text-sage-300"
                    : "text-text-muted active:text-text-secondary"
                )}
                aria-label={item.label}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { Sidebar, MobileBottomNav };
