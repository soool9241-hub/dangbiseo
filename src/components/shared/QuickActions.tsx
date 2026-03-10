"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  Droplets,
  Syringe,
  UtensilsCrossed,
  Dumbbell,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const actions = [
  { label: "혈당", icon: Droplets, href: "/record/glucose", color: "bg-teal-500 hover:bg-teal-600 text-white" },
  { label: "인슐린", icon: Syringe, href: "/record/insulin", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { label: "식단", icon: UtensilsCrossed, href: "/record/meal", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { label: "운동", icon: Dumbbell, href: "/record/exercise", color: "bg-green-500 hover:bg-green-600 text-white" },
  { label: "기분", icon: Heart, href: "/record/mood", color: "bg-pink-500 hover:bg-pink-600 text-white" },
] as const

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)]">
      {/* Action buttons */}
      <div
        className={cn(
          "flex flex-col items-end gap-2 transition-all duration-300",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {actions.map(({ label, icon: Icon, href, color }, index) => (
          <Link
            key={href}
            href={href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              isOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            )}
            style={{ transitionDelay: isOpen ? `${index * 50}ms` : "0ms" }}
          >
            <span className="rounded-lg bg-background/90 px-2.5 py-1 text-sm font-medium shadow-md backdrop-blur-sm">
              {label}
            </span>
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full shadow-lg",
                color
              )}
            >
              <Icon className="size-5" />
            </span>
          </Link>
        ))}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "size-14 rounded-full bg-teal-600 shadow-lg transition-transform duration-300 hover:bg-teal-700",
          isOpen && "rotate-45"
        )}
        size="icon-lg"
      >
        <Plus className="size-6 text-white" />
      </Button>
    </div>
  )
}
