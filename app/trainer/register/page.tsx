import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import RegisterForm from "./register-form"

export const metadata = {
  title: "הרשמת מאמן — סטודיו איתי",
}

export default async function RegisterPage() {
  // Already logged in? Send to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/trainer/clients")

  return <RegisterForm />
}
