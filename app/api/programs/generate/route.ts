import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient, createAdminClient } from "@/lib/supabase/server"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  instructions: string
}

export interface GeneratedDay {
  day_title: string
  day_of_week: string
  exercises: GeneratedExercise[]
}

export interface GeneratedPlan {
  title: string
  goal: string
  notes: string
  safety_notes: string
  days: GeneratedDay[]
}

// ─── System Prompt (cached — stays constant across all requests) ──────────────

const SYSTEM_PROMPT = `אתה מאמן כושר מקצועי שיוצר תוכניות אימון מותאמות אישית בעברית.

כללי בטיחות חובה — אסור לסטות מהם:
1. אין לתת אבחנה רפואית בשום מקרה.
2. אין להמליץ להתאמן דרך כאב חד או ממושך.
3. אם ללקוח יש כאב חזק, פציעה, סחרחורת, כאב בחזה, או בעיה רפואית — חובה להפנות לרופא, פיזיותרפיסט, או איש מקצוע רפואי, ולציין זאת ב-safety_notes.
4. יש להתאים עומס לרמת הכושר של הלקוח: מתחיל = עומס נמוך, חזרות גבוהות; מתקדם = עומס גבוה יותר.
5. אם יש מגבלות גופניות — יש לבחור תרגילים עדינים ובטוחים, ולהימנע מהמגבלה.
6. התוכנית היא המלצה למאמן לבדיקה ואישור — לא תחליף לייעוץ רפואי.

פורמט תשובה — חובה מוחלטת:
- החזר JSON בלבד.
- ללא Markdown, ללא backticks, ללא טקסט לפני או אחרי ה-JSON.
- המבנה חייב להיות בדיוק:
{
  "title": "שם התוכנית בעברית",
  "goal": "מטרת התוכנית",
  "notes": "הערות כלליות למאמן על התוכנית",
  "safety_notes": "הערות בטיחות ספציפיות ללקוח זה, כולל הפניה לרופא אם יש פציעות",
  "days": [
    {
      "day_title": "שם יום האימון בעברית",
      "day_of_week": "יום השבוע בעברית",
      "exercises": [
        {
          "name": "שם התרגיל",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 60,
          "instructions": "הוראות ביצוע קצרות וברורות בעברית"
        }
      ]
    }
  ]
}`

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Check ANTHROPIC_API_KEY ──────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY לא מוגדר. הוסף את המשתנה ל-.env.local" },
      { status: 500 }
    )
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let client_id: string
  try {
    const body = await req.json()
    client_id = body.client_id
    if (!client_id) throw new Error("missing client_id")
  } catch {
    return NextResponse.json({ error: "client_id חסר בבקשה" }, { status: 400 })
  }

  // ── Auth: trainer session ────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 })
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!trainer) {
    return NextResponse.json({ error: "לא נמצא פרופיל מאמן" }, { status: 403 })
  }

  // ── Validate client belongs to this trainer ───────────────────────────────
  const admin = await createAdminClient()
  const { data: client } = await admin
    .from("clients")
    .select("id, full_name, goal, fitness_level, limitations, available_days, trainer_id")
    .eq("id", client_id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!client || (client as any).trainer_id !== trainer.id) {
    return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 })
  }

  // ── Build user prompt ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any

  // Extract sessions_per_week from limitations if stored there
  const sessionsMatch = c.limitations?.match(/מספר אימונים מבוקש בשבוע:\s*(\d+)/)
  const sessionsPerWeek = sessionsMatch ? parseInt(sessionsMatch[1], 10) : null
  const targetDays = sessionsPerWeek ?? c.available_days?.length ?? 3

  const fitnessMap: Record<string, string> = {
    beginner: "מתחיל/ה — עומס נמוך, תנועות בסיסיות",
    intermediate: "בינוני/ת — ניסיון כלשהו, יכול/ה להתמודד עם אימון מגוון",
    advanced: "מתקדם/ת — ניסיון עשיר, יכול/ה לעמוד בעומסים גבוהים",
  }

  // Strip the sessions_per_week line from limitations for display
  const cleanLimitations = c.limitations
    ? c.limitations.replace(/מספר אימונים מבוקש בשבוע:\s*\d+\n?/, "").trim()
    : null

  const userPrompt = `צור תוכנית אימון מותאמת אישית עבור הלקוח הבא:

שם: ${c.full_name}
מטרת האימון: ${c.goal ?? "לא צוין"}
רמת כושר: ${fitnessMap[c.fitness_level] ?? c.fitness_level ?? "לא ידוע"}
ימים פנויים לאימון: ${c.available_days?.join(", ") ?? "לא צוין"}
מגבלות גופניות / פציעות: ${cleanLimitations ?? "אין"}

צור תוכנית עם ${targetDays} ימי אימון בשבוע, המותאמת לרמה ולמגבלות של הלקוח.
לכל יום — 3 עד 5 תרגילים.
`

  // ── Call Claude ───────────────────────────────────────────────────────────
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // Cache the system prompt — it's the same for every client request
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    })

    // Extract text from response (skip thinking blocks)
    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "לא התקבלה תשובה מה-AI. נסה שוב." },
        { status: 500 }
      )
    }

    // Parse JSON — Claude may occasionally wrap in backticks despite instructions
    let planText = textBlock.text.trim()
    const jsonMatch = planText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) planText = jsonMatch[1].trim()

    let plan: GeneratedPlan
    try {
      plan = JSON.parse(planText) as GeneratedPlan
    } catch {
      console.error("[generate] JSON parse failed:", planText.slice(0, 200))
      return NextResponse.json(
        { error: "ה-AI החזיר תשובה לא תקינה. נסה שוב." },
        { status: 500 }
      )
    }

    return NextResponse.json({ plan })
  } catch (err) {
    console.error("[generate] Anthropic API error:", err)
    const message =
      err instanceof Anthropic.APIError
        ? `שגיאת API: ${err.message}`
        : "שגיאה בקריאה ל-AI. נסה שוב."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
