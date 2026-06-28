import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("auth callback failed:", error);
      return NextResponse.redirect(`${origin}/?auth_error=exchange_failed`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (e) {
    console.error("auth callback error:", e);
    return NextResponse.redirect(`${origin}/?auth_error=not_configured`);
  }
}
