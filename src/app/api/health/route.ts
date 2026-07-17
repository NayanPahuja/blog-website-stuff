import { NextResponse } from "next/server";

export async function GET() {
  const envCheck = {
    supabaseUrl: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").slice(0, 20) + "...",
    anonKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  return NextResponse.json({ ok: true, env: envCheck });
}
