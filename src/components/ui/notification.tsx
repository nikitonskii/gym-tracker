"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface NotificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  type?: "error" | "success" | "info"
  title?: string
}

export function Notification({
  open,
  onOpenChange,
  message,
  type = "error",
  title,
}: NotificationProps) {
  const bgColor = {
    error: "bg-red-50 dark:bg-red-950",
    success: "bg-green-50 dark:bg-green-950",
    info: "bg-blue-50 dark:bg-blue-950",
  }[type]

  const textColor = {
    error: "text-red-900 dark:text-red-100",
    success: "text-green-900 dark:text-green-100",
    info: "text-blue-900 dark:text-blue-100",
  }[type]

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-0 flex justify-center z-50 p-4 pointer-events-none">
      <div 
        className={cn(
          "max-w-md w-full shadow-lg rounded-lg p-4 pointer-events-auto",
          bgColor
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            {title && (
              <h3 className={cn("font-semibold", textColor)}>
                {title}
              </h3>
            )}
            <p className={cn("text-sm break-words", textColor)}>
              {message}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 ml-4 flex-shrink-0"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 