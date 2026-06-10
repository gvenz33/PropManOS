import { BRAND } from "@/lib/brand";
import { sendEmail } from "@/lib/notifications/outbound";
import {
  buildMonthlySummaryWorkbook,
  fetchMonthlySummaryData,
  monthlySummaryFilename,
} from "@/lib/reports/monthly-summary";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function parsePeriod(searchParams: URLSearchParams) {
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const propertyId = searchParams.get("property_id") || null;
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month, propertyId };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = parsePeriod(new URL(request.url).searchParams);
  if (!period) return NextResponse.json({ error: "Invalid period." }, { status: 400 });

  const data = await fetchMonthlySummaryData(supabase, user.id, period);
  const buffer = await buildMonthlySummaryWorkbook(data);
  const filename = monthlySummaryFilename(period.year, period.month);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    year?: number;
    month?: number;
    property_id?: string | null;
    recipient_email?: string;
    recipient_name?: string;
  };

  const year = Number(body.year ?? new Date().getFullYear());
  const month = Number(body.month ?? new Date().getMonth() + 1);
  const recipientEmail = String(body.recipient_email ?? "").trim().toLowerCase();
  const recipientName = String(body.recipient_name ?? "").trim();

  if (!recipientEmail) {
    return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid period." }, { status: 400 });
  }

  const period = { year, month, propertyId: body.property_id || null };
  const data = await fetchMonthlySummaryData(supabase, user.id, period);
  const buffer = await buildMonthlySummaryWorkbook(data);
  const filename = monthlySummaryFilename(year, month);
  const greeting = recipientName ? `Hi ${recipientName},` : "Hello,";

  const result = await sendEmail(
    recipientEmail,
    `${BRAND.name} monthly report — ${data.periodLabel}`,
    `${greeting}

Attached is your ${data.periodLabel} property summary from ${BRAND.name}.

Highlights:
• ${data.totals.occupied} of ${data.totals.unitCount} units occupied
• Rent collected: ${(data.totals.collectedCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
• Outstanding: ${(data.totals.outstandingCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
• Open maintenance items: ${data.totals.maintenanceOpen}

Open the Excel file for unit detail, invoice status, and maintenance tables.

— ${data.managerName} via ${BRAND.name}`,
    [{ filename, content: buffer.toString("base64") }],
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Email failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
