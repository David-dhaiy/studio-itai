import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import ChatClient from "./chat-client"

export const metadata = {
  title: "מאמן AI אישי — סטודיו איתי",
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: devClientParam } = await searchParams

  // ── Primary: client session ──────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let clientId: string | null = null

  if (user) {
    const { data: sessionClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    if (sessionClient?.id) clientId = sessionClient.id
  }

  // ── Dev fallback: ?client= query param ──────────────────────────────────────
  // TODO: Remove this fallback once all clients are migrated to auth
  if (!clientId && devClientParam) {
    clientId = devClientParam
  }

  if (!clientId) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <div className="space-y-1">
              <p className="font-semibold">מאמן AI אישי</p>
              <p className="text-sm text-muted-foreground">
                יש להתחבר לחשבון כדי להשתמש בצ׳אט
              </p>
            </div>
            <a
              href="/client/login"
              className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              כניסה לחשבון
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  const admin = await createAdminClient()

  // Fetch client
  const { data: client } = await admin
    .from("clients")
    .select("id, full_name")
    .eq("id", clientId)
    .maybeSingle()

  if (!client) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center">
            <p className="font-medium text-destructive">לקוח לא נמצא</p>
            <p className="mt-2 text-sm text-muted-foreground">
              פנה למאמן שלך לסיוע.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch initial chat history (chronological)
  const { data: messages } = await admin
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("client_id", clientId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any

  return (
    <ChatClient
      clientId={clientId}
      clientName={c.full_name}
      initialMessages={(messages ?? []).map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        created_at: m.created_at,
      }))}
    />
  )
}
