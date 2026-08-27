import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/login?verified=true";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/login?verified=true`);
      }
    } catch (e) {
      console.error("Auth callback exchange error:", e);
    }
  }

  // Fallback redirect to login with verified flag
  return NextResponse.redirect(`${origin}/login?verified=true`);
}
