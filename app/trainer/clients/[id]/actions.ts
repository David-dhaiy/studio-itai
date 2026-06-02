"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import type { GeneratedPlan } from "@/app/api/programs/generate/route"

export interface SavePlanResult {
  success: boolean
  error?: string
  workout_id?: string
}

export async function saveAiPlan(
  client_id: string,
  plan: GeneratedPlan
): Promise<SavePlanResult> {
  // ── Auth + trainer ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "נדרשת התחברות" }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!trainer) return { success: false, error: "לא נמצא פרופיל מאמן" }

  // ── Verify client belongs to this trainer ───────────────────────────────────
  const admin = await createAdminClient()
  const { data: client } = await admin
    .from("clients")
    .select("id, trainer_id")
    .eq("id", client_id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!client || (client as any).trainer_id !== trainer.id) {
    return { success: false, error: "לקוח לא נמצא" }
  }

  // ── Build notes (plan notes + safety notes) ─────────────────────────────────
  const notesParts = [
    plan.notes,
    plan.safety_notes ? `הערות בטיחות:\n${plan.safety_notes}` : null,
  ].filter(Boolean)
  const combinedNotes = notesParts.length > 0 ? notesParts.join("\n\n") : null

  // ── Insert workout ──────────────────────────────────────────────────────────
  const { data: workout, error: workoutError } = await admin
    .from("workouts")
    .insert({
      client_id,
      trainer_id: trainer.id,
      title: plan.title,
      goal: plan.goal || null,
      notes: combinedNotes,
      source: "ai",
    })
    .select("id")
    .single()

  if (workoutError || !workout) {
    console.error("[saveAiPlan] insert workout failed:", workoutError)
    return { success: false, error: "שגיאה בשמירת התוכנית. נסה שוב." }
  }

  // ── Insert workout_days + exercises ─────────────────────────────────────────
  for (let i = 0; i < plan.days.length; i++) {
    const day = plan.days[i]

    const { data: wd, error: wdError } = await admin
      .from("workout_days")
      .insert({
        workout_id: workout.id,
        day_of_week: day.day_of_week,
        title: day.day_title,
        sort_order: i + 1,
      })
      .select("id")
      .single()

    if (wdError || !wd) {
      console.error("[saveAiPlan] insert workout_day failed:", wdError)
      continue
    }

    const exerciseRows = day.exercises.map((ex, j) => ({
      workout_day_id: wd.id,
      name: ex.name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      rest_seconds: ex.rest_seconds ?? null,
      instructions: ex.instructions ?? null,
      sort_order: j + 1,
    }))

    const { error: exError } = await admin.from("exercises").insert(exerciseRows)
    if (exError) {
      console.error("[saveAiPlan] insert exercises failed:", exError)
    }
  }

  return { success: true, workout_id: workout.id }
}
