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
  const { t: trainerId } = await searchParams

  // 1. Missing trainer ID
  if (!trainerId) {
    return (
      <ErrorCard
        title="חסר קישור הצטרפות"
        body="בקש/י מהמאמן שלך קישור הצטרפות חדש."
      />
    )
  }

  // 2. Validate trainer exists — admin client bypasses RLS so anonymous visitors can check
  const admin = await createAdminClient()
  const { data: trainer } = await admin
    .from("trainers")
    .select("id")
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

  // 3. Valid trainer — show the join form
  return <JoinForm trainerId={trainerId} />
}
