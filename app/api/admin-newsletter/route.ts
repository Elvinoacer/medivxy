import { NextResponse } from "next/server";
import { listSubscribers } from "@/lib/newsletter";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** Staff view of the newsletter list (demo passcode gate). */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscribers = await listSubscribers();
  return NextResponse.json(
    {
      subscribers,
      total: subscribers.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
