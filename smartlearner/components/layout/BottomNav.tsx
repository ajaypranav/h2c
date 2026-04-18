"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutDashboard, BookOpen, Brain, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/topics/new", label: "Topics", icon: BookOpen },
  { href: "/review", label: "Review", icon: Brain },
  { href: "/settings", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-border-muted">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3 rounded-[var(--radius-lg)] transition-all duration-200 min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-text-muted"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-[var(--radius-full)] transition-all duration-200",
                  isActive && "bg-primary-light"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  isActive ? "text-primary" : "text-text-light"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
