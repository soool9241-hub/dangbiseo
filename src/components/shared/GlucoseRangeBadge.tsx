import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface GlucoseRangeBadgeProps {
  value: number
  targetMin?: number
  targetMax?: number
  className?: string
}

function getGlucoseStatus(value: number, targetMin: number, targetMax: number) {
  if (value < targetMin) {
    return {
      label: "저혈당",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    }
  }
  if (value > targetMax) {
    return {
      label: "고혈당",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    }
  }
  return {
    label: "정상",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  }
}

export function GlucoseRangeBadge({
  value,
  targetMin = 70,
  targetMax = 180,
  className,
}: GlucoseRangeBadgeProps) {
  const { label, className: statusClassName } = getGlucoseStatus(
    value,
    targetMin,
    targetMax
  )

  return (
    <Badge
      variant="secondary"
      className={cn(statusClassName, className)}
    >
      {label}
    </Badge>
  )
}
