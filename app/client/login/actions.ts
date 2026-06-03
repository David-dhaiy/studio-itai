"use server"

import { createClient } from "@/lib/supabase/server"

export interface LoginResult {
  success: boolean
  error?: string
}

export async function loginClient(
  email: string,
  password: string
): Promise<LoginResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    return { success: false, error: "אימייל או סיסמה שגויים." }
  }

  // Verify the user is actually a client (not a trainer)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "שגיאת התחברות. נסה שוב." }
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!client) {
    // Logged-in user has no client record — sign them out
    await supabase.auth.signOut()
    return {
      success: false,
      error: "לא נמצא חשבון לקוח עבור כתובת אימייל זו.",
    }
  }

  return { success: true }
}
