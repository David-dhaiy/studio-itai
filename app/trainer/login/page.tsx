import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LoginForm from "./login-form"

export const metadata = {
  title: "כניסת מאמן — סטודיו איתי",
}

export default async function LoginPage() {
  // Already logged in? Send to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/trainer/clients")

  return <LoginForm />
}
