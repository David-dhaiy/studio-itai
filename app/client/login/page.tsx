import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ClientLoginForm from "./login-form"

export const metadata = {
  title: "כניסה — סטודיו איתי",
}

export default async function ClientLoginPage() {
  // Already logged in as a client? Go to plan
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    if (client) redirect("/my-plan")
  }

  return <ClientLoginForm />
}
