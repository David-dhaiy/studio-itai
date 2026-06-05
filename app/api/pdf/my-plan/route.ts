import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import React from "react"
import { WorkoutPlanPDF } from "@/lib/pdf/workout-plan"
import type { WorkoutDay } from "@/app/my-plan/workout-day-card"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  // ── Auth: verify client session ──────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { data: sessionClient } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!sessionClient?.id) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const clientId = sessionClient.id

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const admin = await createAdminClient()

  const [{ data: client }, { data: workout }] = await Promise.all([
    admin
      .from("clients")
      .select("id, full_name, goal")
      .eq("id", clientId)
      .maybeSingle(),

    admin
      .from("workouts")
      .select(
        `id, title, goal,
         workout_days (
           id, title, day_of_week, sort_order,
           exercises (
             id, name, sets, reps, rest_seconds, instructions, sort_order
           )
         )`
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!client) {
    return new NextResponse("Client not found", { status: 404 })
  }

  if (!workout) {
    return new NextResponse("No workout plan found", { status: 404 })
  }

  // ── Sort workout days ────────────────────────────────────────────────────────
  const rawDays = (workout.workout_days ?? []) as WorkoutDay[]
  const sortedDays = [...rawDays].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  // ── Generate PDF ─────────────────────────────────────────────────────────────
  const element = React.createElement(WorkoutPlanPDF, {
    clientName: client.full_name,
    clientGoal: client.goal ?? null,
    workoutTitle: workout.title,
    workoutGoal: workout.goal ?? null,
    days: sortedDays,
  }) as React.ReactElement<DocumentProps>

  const buffer = await renderToBuffer(element)

  // ── Return as download ───────────────────────────────────────────────────────
  const filenameSlug = client.full_name
    .replace(/[^\w֐-׿ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`תוכנית-אימון-${filenameSlug}`)}.pdf`,
      "Cache-Control": "no-store",
    },
  })
}
