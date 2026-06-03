import { createAdminClient } from "@/lib/supabase/server"
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
  const { t: rawTrainerId } = await searchParams
  // Trim whitespace and normalise — URL params can carry invisible chars
  const trainerId = rawTrainerId?.trim()

  console.info("[join page] trainerId from URL:", trainerId ?? "MISSING")

  if (!trainerId) {
    return (
      <ErrorCard
        title="חסר קישור הצטרפות"
        body="בקש/י מהמאמן שלך קישור הצטרפות חדש."
      />
    )
  }

  // Validate trainer — admin client bypasses RLS for anonymous visitors
  const admin = await createAdminClient()
  const { data: trainer, error: trainerError } = await admin
    .from("trainers")
    .select("id")
    .eq("id", trainerId)
    .maybeSingle()

  console.info(
    "[join page] trainer lookup — found:",
    !!trainer,
    "| error:", trainerError?.message ?? "none"
  )

  if (!trainer) {
    return (
      <ErrorCard
        title="קישור הצטרפות לא תקין"
        body="פנה/י למאמן שלך לקבלת קישור חדש."
      />
    )
  }

  // Pass trainer.id from DB (not raw URL param) for safety
  console.info("[join page] rendering JoinForm with trainer.id:", trainer.id)
  return <JoinForm trainerId={trainer.id} />
}
