import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Handles PKCE code exchange for:
// - Password reset (redirectTo: /auth/callback?next=/reset-password)
// - Any future OAuth or magic-link flows
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const errorParam = searchParams.get("error")

  if (errorParam) {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignored in Server Components — not relevant in Route Handlers
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.info("[auth/callback] code exchanged successfully, redirecting to:", next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Server-side log — appears in Vercel function logs
    console.error(
      "[auth/callback] exchangeCodeForSession failed:",
      error.status,
      error.message,
      "| code prefix:", code.substring(0, 8) + "...",
      "| next:", next
    )
  }

  console.warn("[auth/callback] no valid code in request, origin:", origin)
  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
}
