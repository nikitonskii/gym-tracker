"use client"

import * as React from "react"
import { Notification } from "@/components/ui/notification"

interface NotificationContextType {
  showNotification: (message: string, type?: "error" | "success" | "info", title?: string) => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [type, setType] = React.useState<"error" | "success" | "info">("error")
  const [title, setTitle] = React.useState<string>()

  const showNotification = React.useCallback((message: string, type: "error" | "success" | "info" = "error", title?: string) => {
    setMessage(message)
    setType(type)
    setTitle(title)
    setOpen(true)

    // Auto-dismiss after 5 seconds for success and info messages
    if (type !== "error") {
      setTimeout(() => {
        setOpen(false)
      }, 5000)
    }
  }, [])

  // Handle Next.js errors
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Ignore errors from third-party scripts
      if (event.filename?.includes('chrome-extension') || 
          event.filename?.includes('nextjs-toast') ||
          event.filename?.includes('nextjs-error-with-static')) {
        return
      }
      
      const errorMessage = event.error?.message || "An error occurred"
      showNotification(errorMessage, "error", "Error")
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [showNotification])

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Ignore errors from third-party scripts
      if (event.reason?.message?.includes('nextjs-toast') ||
          event.reason?.message?.includes('nextjs-error-with-static')) {
        return
      }

      const errorMessage = event.reason?.message || "An error occurred"
      showNotification(errorMessage, "error", "Error")
    }

    window.addEventListener("unhandledrejection", handleRejection)
    return () => window.removeEventListener("unhandledrejection", handleRejection)
  }, [showNotification])

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Notification
        open={open}
        onOpenChange={setOpen}
        message={message}
        type={type}
        title={title}
      />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
} 