"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PenLine,
  TrendingUp,
  ShieldAlert,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "대시보드", icon: LayoutDashboard, href: "/dashboard" },
  { label: "기록", icon: PenLine, href: "/record" },
  { label: "트렌드", icon: TrendingUp, href: "/trends" },
  { label: "비상", icon: ShieldAlert, href: "/emergency" },
  { label: "더보기", icon: MoreHorizontal, href: "/settings" },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-border/40 bg-background/80 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive =
            pathname === href || pathname?.startsWith(`${href}/`)

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                  isActive
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    isActive && "text-teal-600 dark:text-teal-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "font-medium",
                    isActive && "text-teal-600 dark:text-teal-400"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
