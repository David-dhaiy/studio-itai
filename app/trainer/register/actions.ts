"use server"

import { createAuthAdminClient, createClient } from "@/lib/supabase/server"

export interface RegisterPayload {
  full_name: string
  email: string
  phone: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: string
}

export async function registerTrainer(data: RegisterPayload): Promise<AuthResult> {
  const authAdmin = createAuthAdminClient()

  // Create auth user (email_confirm: true skips email verification for MVP)
  const { data: authData, error: authError } = await authAdmin.auth.admin.createUser({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes("already been registered") || authError.code === "email_exists") {
      return { success: false, error: "כתובת האימייל כבר רשומה במערכת." }
    }
    console.error("[register] createUser failed:", authError)
    return { success: false, error: "שגיאה ביצירת החשבון. נסה שוב." }
  }

  // Insert trainer profile
  const { error: trainerError } = await authAdmin
    .from("trainers")
    .insert({
      user_id: authData.user.id,
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim() || null,
    })

  if (trainerError) {
    // Rollback: delete the auth user we just created
    await authAdmin.auth.admin.deleteUser(authData.user.id)
    console.error("[register] insert trainer failed:", trainerError)
    return { success: false, error: "שגיאה ביצירת פרופיל המאמן. נסה שוב." }
  }

  // Sign in (sets session cookie via @supabase/ssr cookie handling)
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email.trim().toLowerCase(),
    password: data.password,
  })

  if (signInError) {
    console.error("[register] auto sign-in failed:", signInError)
    // User was created but sign-in failed — send them to login
    return { success: false, error: "החשבון נוצר. אנא התחבר/י ידנית." }
  }

  return { success: true }
}
