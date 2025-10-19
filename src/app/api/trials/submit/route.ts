import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // later: validate & persist; stay blind (no correctness here)
  return NextResponse.json({ ok: true, received: body, ts_server: Date.now() });
}
