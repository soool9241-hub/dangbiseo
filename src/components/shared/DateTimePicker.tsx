"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  value: Date
  onChange: (date: Date) => void
  showTime?: boolean
  className?: string
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function toLocalTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${min}`
}

export function DateTimePicker({
  value,
  onChange,
  showTime = true,
  className,
}: DateTimePickerProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    if (!dateStr) return
    const [y, m, d] = dateStr.split("-").map(Number)
    const next = new Date(value)
    next.setFullYear(y, m - 1, d)
    onChange(next)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value
    if (!timeStr) return
    const [h, min] = timeStr.split(":").map(Number)
    const next = new Date(value)
    next.setHours(h, min, 0, 0)
    onChange(next)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="date"
        value={toLocalDateString(value)}
        onChange={handleDateChange}
        className="w-auto"
        aria-label="날짜"
      />
      {showTime && (
        <Input
          type="time"
          value={toLocalTimeString(value)}
          onChange={handleTimeChange}
          className="w-auto"
          aria-label="시간"
        />
      )}
    </div>
  )
}
