import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient, createAdminClient } from "@/lib/supabase/server"

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(client: {
  full_name: string
  goal: string | null
  fitness_level: string | null
  limitations: string | null
  workoutContext: string
}) {
  const fitnessMap: Record<string, string> = {
    beginner: "מתחיל/ה",
    intermediate: "בינוני/ת",
    advanced: "מתקדם/ת",
  }

  const cleanLimitations = client.limitations
    ? client.limitations.replace(/מספר אימונים מבוקש בשבוע:\s*\d+\n?/, "").trim()
    : null

  return `אתה מאמן כושר וירטואלי של הלקוח ${client.full_name}.

פרופיל הלקוח:
- מטרה: ${client.goal ?? "לא צוין"}
- רמת כושר: ${fitnessMap[client.fitness_level ?? ""] ?? client.fitness_level ?? "לא ידוע"}
- מגבלות / פציעות: ${cleanLimitations ?? "אין"}

תוכנית אימון נוכחית:
${client.workoutContext}

כללי בטיחות — חובה לפעול לפיהם:
1. אתה מאמן כושר, לא רופא — אין לתת אבחנה רפואית.
2. אם הלקוח מציין כאב חד, כאב בחזה, סחרחורת, קוצר נשימה חריג, נימול, פציעה או החמרת מצב — יש להפנות לרופא, פיזיותרפיסט, או איש מקצוע רפואי, ולהמליץ לעצור את הפעילות.
3. אין להמליץ להתאמן דרך כאב.
4. אם יש מגבלה גופנית בפרופיל הלקוח, יש להציע חלופה עדינה ובטוחה.
5. לפני שינוי משמעותי בתוכנית, יש לעודד את הלקוח להתייעץ עם המאמן שלו.

סגנון תשובות:
- תשובות קצרות, ברורות, ידידותיות ומעשיות בעברית.
- אם השאלה אינה קשורה לכושר, בריאות או אימון — הפנה בנימוס חזרה לנושאים שבתחום שלך.`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY לא מוגדר בשרת" },
      { status: 500 }
    )
  }

  // Parse body — only message is needed from the client
  let message: string
  try {
    const body = await req.json()
    message = body.message?.trim()
    if (!message) throw new Error("missing message")
  } catch {
    return NextResponse.json({ error: "message נדרש" }, { status: 400 })
  }

  // ── Auth: verify client session ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 })
  }

  // Identify client from session (not from request body — prevents spoofing)
  const admin = await createAdminClient()
  const { data: rawClient } = await admin
    .from("clients")
    .select("id, full_name, goal, fitness_level, limitations, trainer_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!rawClient) {
    return NextResponse.json({ error: "לקוח לא נמצא עבור חשבון זה" }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = rawClient as any

  // Fetch latest workout with days + exercises
  const { data: rawWorkout } = await admin
    .from("workouts")
    .select(
      `title, workout_days(title, day_of_week, exercises(name, sets, reps))`
    )
    .eq("client_id", c.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let workoutContext = "אין תוכנית אימון פעילה כרגע."
  if (rawWorkout) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = rawWorkout as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const daysText = (w.workout_days ?? []).map((d: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exText = (d.exercises ?? []).map((e: any) =>
        [e.name, e.sets && e.reps ? `${e.sets}×${e.reps}` : null]
          .filter(Boolean)
          .join(" ")
      ).join(", ")
      return `• ${d.title} (${d.day_of_week}): ${exText || "ללא תרגילים"}`
    }).join("\n")
    workoutContext = `"${w.title}"\n${daysText}`
  }

  // Fetch last 10 conversation messages for context (chronological order)
  const { data: rawHistory } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("client_id", c.id)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(10)

  const historyAsc = ((rawHistory ?? []) as { role: string; content: string }[])
    .reverse()

  // Build Claude messages (history + new message)
  const claudeMessages: Anthropic.MessageParam[] = [
    ...historyAsc.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ]

  // Save user message first
  await admin.from("chat_messages").insert({
    client_id: c.id,
    trainer_id: c.trainer_id,
    role: "user",
    content: message,
    safety_flag: false,
  })

  // Call Claude
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: buildSystemPrompt({
        full_name: c.full_name,
        goal: c.goal,
        fitness_level: c.fitness_level,
        limitations: c.limitations,
        workoutContext,
      }),
      messages: claudeMessages,
    })

    const textBlock = response.content.find((b) => b.type === "text")
    const aiText =
      textBlock?.type === "text"
        ? textBlock.text
        : "מצטער, לא הצלחתי לענות. נסה שוב."

    // Detect safety keywords to flag
    const safetyKeywords = ["כאב", "פציעה", "רופא", "פיזיותרפיסט", "עצור"]
    const safetyFlag = safetyKeywords.some((kw) => message.includes(kw))

    // Save AI response
    await admin.from("chat_messages").insert({
      client_id: c.id,
      trainer_id: c.trainer_id,
      role: "assistant",
      content: aiText,
      safety_flag: safetyFlag,
    })

    return NextResponse.json({ message: aiText })
  } catch (err) {
    console.error("[chat] Anthropic error:", err)
    const errMsg =
      err instanceof Anthropic.APIError
        ? `שגיאת AI: ${err.message}`
        : "שגיאה בצ'אט. נסה שוב."
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
