"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Password input with a show/hide eye toggle.
// Uses physical right-side positioning because all password fields use dir="ltr",
// so text flows LTR and the icon must be physically on the right side regardless
// of the page's RTL direction.
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        // pr-10: physical right padding keeps text clear of the toggle button
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "הסתר סיסמה" : "הצג סיסמה"}
        tabIndex={-1}
        // right-2: physical right — places icon on right side of the LTR input
        className="absolute inset-y-0 right-2 my-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </div>
  )
}

export { PasswordInput }
