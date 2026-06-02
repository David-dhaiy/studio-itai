"use server"

import { createAdminClient } from "@/lib/supabase/server"

export interface LogWorkoutResult {
  success: boolean
  error?: string
}

export async function logWorkoutCompletion(
  client_id: string,
  workout_day_id: string
): Promise<LogWorkoutResult> {
  const supabase = await createAdminClient()

  // Verify the client + workout_day both exist and are related
  const { data: wd } = await supabase
    .from("workout_days")
    .select("id, workout_id, workouts!inner(client_id)")
    .eq("id", workout_day_id)
    .maybeSingle()

  if (!wd) {
    return { success: false, error: "יום האימון לא נמצא." }
  }

  // TypeScript: wd.workouts is typed as any by the untyped client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutClientId = (wd as any).workouts?.client_id
  if (workoutClientId !== client_id) {
    return { success: false, error: "אין הרשאה לפעולה זו." }
  }

  const { error } = await supabase.from("workout_logs").insert({
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
