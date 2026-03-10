"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="alert"
      className={cn(
        "fixed top-0 left-0 right-0 z-[60]",
        "flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-yellow-950"
      )}
    >
      <WifiOff className="size-4 shrink-0" />
      <span>오프라인 상태입니다. 기록은 자동으로 저장됩니다.</span>
    </div>
  )
}
