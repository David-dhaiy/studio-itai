import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ResetPasswordForm from "./reset-password-form"

export const metadata = {
  title: "סיסמה חדשה — סטודיו איתי",
}

export default async function ResetPasswordPage() {
  // User must have an active recovery session (set by /auth/callback)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/forgot-password?error=invalid_link")
  }

  return <ResetPasswordForm />
}
