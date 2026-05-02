import { NextResponse } from "next/server";

/**
 * Daily cron: compare open invoices to today and enqueue email/SMS.
 * Wire Resend + Twilio with SUPABASE_SERVICE_ROLE_KEY for notification_log inserts.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Placeholder: implement with service role + invoice query + templates:
  // - due_in_3_days: due_date === today + 3
  // - due_today: due_date === today
  // - late: status === 'late' or past grace

  return NextResponse.json({
    ok: true,
    message:
      "Stub: add Supabase service client, fetch invoices, send via Resend/Twilio, insert notification_log rows.",
  });
}
