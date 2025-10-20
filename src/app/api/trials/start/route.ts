import { NextResponse } from "next/server";
import * as secp from "@noble/secp256k1";
import { randomBytes } from "node:crypto";

const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
const m = (n - 1n) / 2n;

function rand32(): Uint8Array {
  return randomBytes(32); // returns Buffer (Uint8Array)
}
function u8ToBig(u8: Uint8Array) {
  return BigInt("0x" + Buffer.from(u8).toString("hex"));
}

export async function POST() {
  let d: bigint;
  // unbiased rejection sampling into [1..n-1]
  while (true) {
    const x = u8ToBig(rand32());
    if (x !== 0n && x < n) { d = x; break; }
  }

  // noble expects hex/bytes; pass 32-byte hex
  const privHex = d.toString(16).padStart(64, "0");
  const pubBytes = secp.getPublicKey(privHex, true); // compressed
  const pubkey = Buffer.from(pubBytes).toString("hex");

  const trial_id = crypto.randomUUID();
  // keep side server-only for now:
  // const side = d <= m ? "L" : "R";

  return NextResponse.json({ trial_id, pubkey, ts_server: Date.now() });
}
