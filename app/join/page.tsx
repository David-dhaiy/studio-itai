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
  const { t: rawTrainerId } = await searchParams

  console.info("[join page] raw t:", rawTrainerId ?? "MISSING")

  // Trim whitespace — URL params can carry invisible chars
  const trainerId = rawTrainerId?.trim()

  console.info("[join page] trimmed trainerId:", trainerId ?? "MISSING")

  if (!trainerId) {
    return (
      <ErrorCard
        title="חסר קישור הצטרפות"
        body="בקש/י מהמאמן שלך קישור הצטרפות חדש."
      />
    )
  }

  // Use raw @supabase/supabase-js admin client (SUPABASE_SECRET_KEY).
  // createAdminClient() wraps @supabase/ssr which respects RLS in some
  // Next.js contexts — this raw client always bypasses RLS.
  console.info("[join page] using auth admin client: true")
  const rawAdmin = createAuthAdminClient()

  const { data: trainer, error: trainerError } = await rawAdmin
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

  // Pass trainer.id from DB (not raw URL param)
  console.info("[join page] rendering JoinForm with trainer.id prefix:", trainer.id.substring(0, 8))
  return <JoinForm trainerId={trainer.id} />
}
