"use server"

import { createClient } from "@/lib/supabase/server"

export interface UpdatePasswordResult {
  success: boolean
  error?: string
}

export async function updatePassword(
  password: string
): Promise<UpdatePasswordResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error("[reset-password] updateUser failed:", error)
    return {
      success: false,
      error: "שגיאה בעדכון הסיסמה. ייתכן שהקישור פג תוקפו — בקש/י קישור חדש.",
    }
  }

  return { success: true }
}
