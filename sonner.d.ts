declare module "sonner" {
  import type { ReactNode } from "react"

  export type ToasterProps = {
    theme?: "light" | "dark" | "system"
    className?: string
    toastOptions?: {
      classNames?: {
        toast?: string
        description?: string
        actionButton?: string
        cancelButton?: string
      }
    }
    position?:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
    richColors?: boolean
    closeButton?: boolean
    duration?: number
    visibleToasts?: number
  } & Record<string, unknown>

  export function Toaster(props: ToasterProps): ReactNode

  export const toast: {
    (message: string, options?: Record<string, unknown>): string | number
    success: (message: string, options?: Record<string, unknown>) => string | number
    error: (message: string, options?: Record<string, unknown>) => string | number
    info: (message: string, options?: Record<string, unknown>) => string | number
    warning: (message: string, options?: Record<string, unknown>) => string | number
    dismiss: (id?: string | number) => void
    loading: (message: string, options?: Record<string, unknown>) => string | number
  }
}
