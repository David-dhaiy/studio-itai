"use server"

import { createAuthAdminClient, createClient } from "@/lib/supabase/server"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JoinFormPayload {
  trainer_id: string
  full_name: string
  phone: string
  email: string          // now required for auth account
  password: string       // new — creates auth user
  goal: string
  fitness_level: string
  available_days: string[]
  limitations: string | null
  sessions_per_week: string
}

export interface JoinFormResult {
  success: boolean
  error?: string
  client_id?: string
}

// ─── Demo Plan Data ───────────────────────────────────────────────────────────

const DEMO_DAYS = [
  {
    title: "אימון גוף מלא",
    day_of_week: "ראשון",
    exercises: [
      { name: "סקוואט", sets: 3, reps: "10", rest_seconds: 60, instructions: "שמור/י על גב ישר ורגליים ברוחב כתפיים" },
      { name: "שכיבות סמיכה", sets: 3, reps: "8–12", rest_seconds: 60, instructions: null },
      { name: "פלאנק", sets: 3, reps: "30 שניות", rest_seconds: 45, instructions: "שמור/י על גוף ישר ובטן מכווצת" },
    ],
  },
  {
    title: "כוח בסיסי",
    day_of_week: "שלישי",
    exercises: [
      { name: "לאנג'ים", sets: 3, reps: "10 לכל רגל", rest_seconds: 60, instructions: null },
      { name: "חתירה עם גומייה / משקולת", sets: 3, reps: "12", rest_seconds: 60, instructions: null },
      { name: "גשר ישבן", sets: 3, reps: "12", rest_seconds: 45, instructions: "שמור/י על כיווץ הישבן בפסגה" },
    ],
  },
  {
    title: "כושר כללי",
    day_of_week: "חמישי",
    exercises: [
      { name: "הליכה מהירה / אופניים", sets: 1, reps: "20 דקות", rest_seconds: null, instructions: null },
      { name: "כפיפות בטן קלות", sets: 3, reps: "12", rest_seconds: 45, instructions: null },
      { name: "מתיחות", sets: 1, reps: "8 דקות", rest_seconds: null, instructions: "מתח כל קבוצת שרירים 30–40 שניות" },
    ],
  },
  {
    title: "אימון עליון",
    day_of_week: "שני",
    exercises: [
      { name: "כפיפות עם גומייה", sets: 3, reps: "10", rest_seconds: 60, instructions: null },
      { name: "לחיצה מעל לראש", sets: 3, reps: "10", rest_seconds: 60, instructions: null },
      { name: "חתירה ישרה", sets: 3, reps: "12", rest_seconds: 60, instructions: null },
    ],
  },
  {
    title: "אימון תחתון",
    day_of_week: "רביעי",
    exercises: [
      { name: "דדליפט רומני", sets: 3, reps: "10", rest_seconds: 90, instructions: "שמור/י על גב ישר לאורך כל התנועה" },
      { name: "לחיצת רגליים", sets: 3, reps: "12", rest_seconds: 60, instructions: null },
      { name: "עלייה על קצות רגליים", sets: 3, reps: "15", rest_seconds: 45, instructions: null },
    ],
  },
]

// ─── Create Demo Plan ─────────────────────────────────────────────────────────

async function createDemoPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  client_id: string,
  trainer_id: string,
  sessions_per_week: string
) {
  const numDays = Math.max(2, Math.min(5, parseInt(sessions_per_week, 10) || 3))
  const days = DEMO_DAYS.slice(0, numDays)

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({ client_id, trainer_id, title: "תוכנית בסיסית", goal: "כושר כללי ובריאות", source: "demo" })
    .select("id")
    .single()

  if (workoutError || !workout) {
    console.error("[demo] insert workout failed:", workoutError)
    return
  }

  for (let i = 0; i < days.length; i++) {
    const dayTemplate = days[i]
    const { data: wd, error: wdError } = await supabase
      .from("workout_days")
      .insert({ workout_id: workout.id, day_of_week: dayTemplate.day_of_week, title: dayTemplate.title, sort_order: i + 1 })
      .select("id")
      .single()

    if (wdError || !wd) { console.error("[demo] insert workout_day failed:", wdError); continue }

    const exerciseRows = dayTemplate.exercises.map((ex, j) => ({
      workout_day_id: wd.id, name: ex.name, sets: ex.sets, reps: ex.reps,
      rest_seconds: ex.rest_seconds ?? null, instructions: ex.instructions ?? null, sort_order: j + 1,
    }))
    const { error: exError } = await supabase.from("exercises").insert(exerciseRows)
    if (exError) console.error("[demo] insert exercises failed:", exError)
  }
}

// ─── Submit Join Form ─────────────────────────────────────────────────────────

export async function submitJoinForm(data: JoinFormPayload): Promise<JoinFormResult> {
  // Fail fast if service role key is not configured
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { success: false, error: "שגיאת שרת. פנה/י לתמיכה." }
  }

  const trainerId = data.trainer_id?.trim()

  if (!trainerId) {
    return { success: false, error: "חסר מזהה מאמן בטופס" }
  }

  // Use raw @supabase/supabase-js client for ALL DB operations.
  // This guarantees service-role behaviour regardless of SSR/cookie context.
  // (createAdminClient() uses @supabase/ssr which may behave differently in
  //  Server Actions when a user session is present in cookies.)
  const rawAdmin = createAuthAdminClient()

  // Validate trainer exists
  const { data: trainer, error: trainerLookupError } = await rawAdmin
    .from("trainers")
    .select("id")
    .eq("id", trainerId)
    .maybeSingle()

  if (!trainer) {
    return { success: false, error: "קישור הצטרפות לא תקין. פנה/י למאמן שלך לקבלת קישור חדש." }
  }

  // Create auth user
  const email = data.email.trim().toLowerCase()
  const { data: authData, error: authError } = await rawAdmin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
  })

  if (authError) {
    const alreadyExists =
      authError.message.toLowerCase().includes("already") ||
      (authError as { code?: string }).code === "email_exists"
    if (alreadyExists) {
      return { success: false, error: "כתובת האימייל כבר רשומה במערכת. נסה/י להתחבר." }
    }
    console.error("[join] createUser failed:", authError.message)
    return { success: false, error: "לא ניתן ליצור משתמש. נסה/י שוב." }
  }

  // Insert client
  const { data: client, error: insertError } = await rawAdmin
    .from("clients")
    .insert({
      trainer_id: trainerId,
      user_id: authData.user.id,
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      email,
      goal: data.goal,
      fitness_level: data.fitness_level,
      available_days: data.available_days,
      limitations: data.limitations,
      status: "active",
    })
    .select("id")
    .single()

  if (insertError || !client) {
    await rawAdmin.auth.admin.deleteUser(authData.user.id)
    console.error("[join] insert client failed:", insertError?.message)
    return { success: false, error: "לא ניתן לשמור לקוח. נסה/י שוב." }
  }

  // Create demo plan (also using raw admin — same reasons as above)
  await createDemoPlan(rawAdmin, client.id, trainerId, data.sessions_per_week)

  // Sign in via SSR client so the session cookie is set correctly
  const serverClient = await createClient()
  const { error: signInError } = await serverClient.auth.signInWithPassword({
    email,
    password: data.password,
  })

  if (signInError) {
    console.error("[join] auto sign-in failed:", signInError.message)
    return { success: false, error: "החשבון נוצר בהצלחה. אנא התחבר/י ידנית." }
  }

  return { success: true, client_id: client.id }
}
