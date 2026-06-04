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
  // ── Environment diagnostics ────────────────────────────────────────────────
  const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey     = process.env.SUPABASE_SECRET_KEY

  console.info("[join page] env url exists:", !!supabaseUrl)
  console.info("[join page] secret key exists:", !!secretKey)
  if (secretKey) {
    console.info("[join page] secret key prefix:", secretKey.substring(0, 8))
  }

  // Fail fast with a visible error if the service-role key is missing
  if (!supabaseUrl || !secretKey) {
    console.error("[join page] MISSING env vars — url:", !!supabaseUrl, "key:", !!secretKey)
    return (
      <ErrorCard
        title="שגיאת הגדרות שרת: חסר מפתח Supabase Secret"
        body="יש להגדיר SUPABASE_SECRET_KEY ו-NEXT_PUBLIC_SUPABASE_URL ב-Vercel Environment Variables."
      />
    )
  }

  // ── Trainer ID from URL ────────────────────────────────────────────────────
  const { t: rawTrainerId } = await searchParams
  console.info("[join page] raw t:", rawTrainerId ?? "MISSING")

  const trainerId = rawTrainerId?.trim()
  console.info("[join page] trimmed trainerId prefix:",
    trainerId ? trainerId.substring(0, 8) + "..." : "MISSING")

  if (!trainerId) {
    return (
      <ErrorCard
        title="חסר קישור הצטרפות"
        body="בקש/י מהמאמן שלך קישור הצטרפות חדש."
      />
    )
  }

  // ── Trainer lookup with raw supabase-js (bypasses RLS) ────────────────────
  // createAuthAdminClient() uses createClient from @supabase/supabase-js
  // directly with SUPABASE_SECRET_KEY — not the @supabase/ssr wrapper.
  const rawAdmin = createAuthAdminClient()

  const { data: trainer, error: trainerError } = await rawAdmin
    .from("trainers")
    .select("id")
    .eq("id", trainerId)
    .maybeSingle()

  console.info(
    "[join page] trainer lookup found:", !!trainer,
    "| error:", trainerError?.message ?? "none",
    "| error code:", trainerError?.code ?? "none"
  )

  if (!trainer) {
    return (
      <ErrorCard
        title="קישור הצטרפות לא תקין"
        body="פנה/י למאמן שלך לקבלת קישור חדש."
      />
    )
  }

  console.info("[join page] rendering JoinForm for trainer prefix:", trainer.id.substring(0, 8))
  return <JoinForm trainerId={trainer.id} />
}
