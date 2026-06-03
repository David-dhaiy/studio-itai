"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function ClientLogoutButton({
  className,
  redirectTo = "/client/login",
  variant = "ghost",
}: {
  className?: string
  redirectTo?: string
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary" | "link"
}) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleLogout}
      className={className}
    >
      התנתק/י
    </Button>
  )
}
