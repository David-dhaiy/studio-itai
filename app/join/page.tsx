import { createAuthAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import JoinForm from "./join-form"

export const metadata = {
  title: "הצטרפות לסטודיו איתי",
}

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <p className="font-medium text-destructive">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  // Fail fast if service-role key is missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return (
      <ErrorCard
        title="שגיאת הגדרות שרת"
        body="יש להגדיר את משתני הסביבה הנדרשים ב-Vercel."
      />
    )
  }

  // ── Trainer ID from URL ────────────────────────────────────────────────────
  const { t: rawTrainerId } = await searchParams
  const trainerId = rawTrainerId?.trim()

  if (!trainerId) {
    return (
      <ErrorCard
        title="חסר קישור הצטרפות"
        body="בקש/י מהמאמן שלך קישור הצטרפות חדש."
      />
    )
  }

  // ── Trainer lookup (bypasses RLS via service-role key) ─────────────────────
  const rawAdmin = createAuthAdminClient()

  const { data: trainer } = await rawAdmin
    .from("trainers")
    .select("id,email,full_name")
    .eq("id", trainerId)
    .maybeSingle()

  if (!trainer) {
    return (
      <ErrorCard
        title="קישור הצטרפות לא תקין"
        body="פנה/י למאמן שלך לקבלת קישור חדש."
      />
    )
  }

  return <JoinForm trainerId={trainer.id} />
}
