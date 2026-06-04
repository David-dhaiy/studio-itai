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

  // ── DIAGNOSTIC: what does the admin client actually see? ──────────────────
  const { data: allTrainers, error: allError } = await rawAdmin
    .from("trainers")
    .select("id,email,full_name")
    .limit(10)

  console.info("[join page] visible trainers count:", allTrainers?.length ?? 0)
  console.info(
    "[join page] visible trainer ids:",
    (allTrainers ?? []).map((t) => t.id).join(", ") || "NONE"
  )
  console.info(
    "[join page] visible trainer emails:",
    (allTrainers ?? []).map((t) => t.email).join(", ") || "NONE"
  )
  if (allError) {
    console.error("[join page] list trainers error:", allError.message, allError.code)
  }

  // ── Exact lookup ──────────────────────────────────────────────────────────
  console.info("[join page] exact trainerId:", trainerId)

  const { data: trainer, error: trainerError } = await rawAdmin
    .from("trainers")
    .select("id,email,full_name")
    .eq("id", trainerId)
    .maybeSingle()

  console.info("[join page] exact lookup found:", !!trainer)
  console.info("[join page] exact lookup data:", trainer ? JSON.stringify(trainer) : "null")
  console.info(
    "[join page] exact lookup error:",
    trainerError?.message ?? "none",
    "| code:", trainerError?.code ?? "none"
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
