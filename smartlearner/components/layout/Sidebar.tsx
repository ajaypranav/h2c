"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics/new", label: "Add Topic", icon: Sparkles },
  { href: "/review", label: "Review", icon: Brain },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-surface border-r border-border-muted transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-primary to-[#9B7BFF] flex items-center justify-center text-white font-bold text-lg shrink-0">
          S
        </div>
        {!collapsed && (
          <span className="font-extrabold text-xl text-text tracking-tight">
            SmartLearner
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-light text-primary shadow-sm"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "shrink-0",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center mx-3 mb-4 py-2 rounded-[var(--radius-md)] text-text-muted hover:bg-surface-2 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!collapsed && (
          <span className="ml-2 text-sm">Collapse</span>
        )}
      </button>
    </aside>
  );
}
