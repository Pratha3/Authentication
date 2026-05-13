// src/components/ui/card.tsx
import * as React from "react"
import { cn } from "../../lib/utils"

export const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50", className)} {...props} />
)
export const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)
export const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
)
export const CardDescription = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
)
export const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)
export const CardFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
)
