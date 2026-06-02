"use server"

import { createClient } from "@/lib/supabase/server"

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: string
}

export async function loginTrainer(data: LoginPayload): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email.trim().toLowerCase(),
    password: data.password,
  })

  if (error) {
    // Avoid leaking whether the email exists
    return { success: false, error: "אימייל או סיסמה שגויים." }
  }

  return { success: true }
}
