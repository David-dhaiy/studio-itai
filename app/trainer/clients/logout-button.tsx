"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/trainer/login")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
      התנתק/י
    </Button>
  )
}
