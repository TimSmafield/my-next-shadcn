import { NextResponse } from "next/server";
import crypto from "node:crypto";

export async function POST() {
  const trial_id = crypto.randomUUID();
  // fake compressed-like hex (placeholder; swap later for real secp256k1 pubkey)
  const pubkey = "02" + crypto.randomBytes(32).toString("hex").slice(0, 64);
  return NextResponse.json({ trial_id, pubkey, ts_server: Date.now() });
}
