"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export interface LogWorkoutResult {
  success: boolean
  error?: string
}

export async function logWorkoutCompletion(
  client_id: string,
  workout_day_id: string
): Promise<LogWorkoutResult> {
  // ── Verify the caller is the owning client ───────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "נדרשת התחברות." }
  }

  const { data: sessionClient } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!sessionClient || sessionClient.id !== client_id) {
    return { success: false, error: "אין הרשאה לפעולה זו." }
  }

  // ── Verify workout_day belongs to this client ────────────────────────────────
  const admin = await createAdminClient()

  const { data: wd } = await admin
    .from("workout_days")
    .select("id, workout_id, workouts!inner(client_id)")
    .eq("id", workout_day_id)
    .maybeSingle()

  if (!wd) {
    return { success: false, error: "יום האימון לא נמצא." }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutClientId = (wd as any).workouts?.client_id
  if (workoutClientId !== client_id) {
    return { success: false, error: "אין הרשאה לפעולה זו." }
  }

  const { error } = await admin.from("workout_logs").insert({
    client_id,
    workout_day_id,
    completed_at: new Date().toISOString(),
    feedback: null,
    difficulty: null,
  })

  if (error) {
    console.error("[my-plan] log workout failed:", error)
    return { success: false, error: "שגיאה בשמירה. נסה שוב." }
  }

  return { success: true }
}
