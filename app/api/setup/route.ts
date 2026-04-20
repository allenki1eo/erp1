import { NextResponse } from "next/server";
import { runFullAdminSetup } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runFullAdminSetup();
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
