import { createAuthAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import JoinForm from "../join-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "הצטרפות מתאמן חדש — סטודיו איתי",
}

// ─── Error card ────────────────────────────────────────────────────────────────

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <p className="font-medium">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function GeneralJoinPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return (
      <ErrorCard
        title="שגיאת הגדרות שרת"
        body="יש להגדיר את משתני הסביבה הנדרשים."
      />
    )
  }

  const rawAdmin = createAuthAdminClient()

  // ── Fetch all trainers ──────────────────────────────────────────────────────
  const { data: trainers, error: trainersError } = await rawAdmin
    .from("trainers")
    .select("id, created_at")
    .order("created_at", { ascending: true })

  if (trainersError || !trainers || trainers.length === 0) {
    return (
      <ErrorCard
        title="אין כרגע מאמן פנוי"
        body="נסה/י שוב מאוחר יותר."
      />
    )
  }

  // ── Count clients per trainer ───────────────────────────────────────────────
  const { data: clients } = await rawAdmin
    .from("clients")
    .select("trainer_id")

  const countMap = new Map<string, number>()
  for (const c of clients ?? []) {
    countMap.set(c.trainer_id, (countMap.get(c.trainer_id) ?? 0) + 1)
  }

  // Sort by client count ASC (tie-break: earliest created_at, already sorted)
  const sorted = [...trainers].sort(
    (a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0)
  )

  const trainer = sorted[0]

  // ── Render join form with the selected trainer ──────────────────────────────
  return <JoinForm trainerId={trainer.id} />
}
