"use client"

import type { ComponentProps } from "react"
import { Toaster as Sonner } from "sonner"

import { useTheme } from "next-themes"

type ToasterProps = ComponentProps<typeof Sonner>

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast border bg-card text-card-foreground shadow-sm",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
