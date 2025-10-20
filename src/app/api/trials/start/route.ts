import { NextResponse } from "next/server";
import * as secp from "noble-secp256k1";
import crypto from "node:crypto";

const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
const m = (n - 1n) / 2n;

function rand32(): Uint8Array { return crypto.getRandomValues(new Uint8Array(32)); }
function u8ToBig(u8: Uint8Array) { return BigInt("0x" + Buffer.from(u8).toString("hex")); }

export async function POST() {
  let d: bigint;
  // rejection sample into [1..n-1]
  while (true) {
    const x = u8ToBig(rand32());
    if (x !== 0n && x < n) { d = x; break; }
  }
  const pub = secp.getPublicKey(d, true); // compressed
  const pubkey = Buffer.from(pub).toString("hex");
  const trial_id = crypto.randomUUID();
  const side = d <= m ? "L" : "R"; // keep server-only for now
  // TODO: persist pubkey+side later
  return NextResponse.json({ trial_id, pubkey, ts_server: Date.now() });
}
