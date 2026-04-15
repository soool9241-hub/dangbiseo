"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  size?: "sm" | "md" | "lg"
}

const sizeConfig = {
  sm: {
    button: "size-8",
    buttonIcon: "size-3.5",
    text: "text-lg",
    unit: "text-xs",
    gap: "gap-2",
    minWidth: "min-w-12",
  },
  md: {
    button: "size-10",
    buttonIcon: "size-4",
    text: "text-2xl",
    unit: "text-sm",
    gap: "gap-3",
    minWidth: "min-w-16",
  },
  lg: {
    button: "size-12",
    buttonIcon: "size-5",
    text: "text-3xl",
    unit: "text-base",
    gap: "gap-4",
    minWidth: "min-w-20",
  },
} as const

export function NumberStepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  size = "md",
}: NumberStepperProps) {
  const config = sizeConfig[size]

  const decrement = () => {
    const next = value - step
    if (next >= min) onChange(next)
  }

  const increment = () => {
    const next = value + step
    if (next <= max) onChange(next)
  }

  const atMin = value <= min
  const atMax = value >= max

  return (
    <div className={cn("flex items-center", config.gap)}>
      <Button
        variant="outline"
        size="icon"
        className={cn("shrink-0 rounded-full", config.button)}
        onClick={decrement}
        disabled={atMin}
        aria-label="감소"
      >
        <Minus className={config.buttonIcon} />
      </Button>

      <div
        className={cn(
          "flex flex-col items-center justify-center",
          config.minWidth
        )}
      >
        <span className={cn("font-bold tabular-nums", config.text)}>
          {value}
        </span>
        {unit && (
          <span
            className={cn("text-muted-foreground", config.unit)}
          >
            {unit}
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        className={cn("shrink-0 rounded-full", config.button)}
        onClick={increment}
        disabled={atMax}
        aria-label="증가"
      >
        <Plus className={config.buttonIcon} />
      </Button>
    </div>
  )
}
