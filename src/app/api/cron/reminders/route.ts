import { buildReminderMessage, type ReminderTemplate } from "@/lib/notifications/templates";
import { sendRentReminder } from "@/lib/notifications/send";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return token === secret;
}

function dateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function templateForInvoice(dueDate: string, status: string, today: string): ReminderTemplate | null {
  if (status === "late") return "late";
  const dueIn3 = dateOnly(addDays(new Date(`${today}T12:00:00`), 3));
  if (dueDate === dueIn3) return "due_in_3_days";
  if (dueDate === today) return "due_today";
  return null;
}

async function runReminders() {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "Missing Supabase service role configuration.", sent: 0 };
  }

  const today = dateOnly(new Date());
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, lease_id, due_date, status, amount_cents, late_fee_cents, late_fee_waived, period_year, period_month",
    )
    .in("status", ["open", "late"]);

  if (error) return { ok: false, error: error.message, sent: 0 };

  let sent = 0;

  for (const inv of invoices ?? []) {
    const template = templateForInvoice(inv.due_date, inv.status, today);
    if (!template) continue;

    const { data: lease } = await supabase
      .from("leases")
      .select("id, tenant_id, tenant_email, unit_id")
      .eq("id", inv.lease_id)
      .maybeSingle();

    if (!lease?.tenant_id) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email, notify_email, notify_sms")
      .eq("id", lease.tenant_id)
      .maybeSingle();

    const { data: unit } = await supabase
      .from("units")
      .select("label, zelle_handle, cashapp_handle, payment_instructions, property_id, properties(name)")
      .eq("id", lease.unit_id)
      .maybeSingle();

    if (!unit) continue;

    const propertyRaw = unit.properties;
    const property = Array.isArray(propertyRaw) ? propertyRaw[0] : propertyRaw;
    const lateFee = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
    const periodLabel = `${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`;
    const message = buildReminderMessage({
      template,
      tenantName: profile?.full_name?.trim() || lease.tenant_email,
      propertyName: property?.name ?? "Your rental",
      unitLabel: unit.label,
      dueDate: inv.due_date,
      amountCents: inv.amount_cents,
      lateFeeCents: lateFee,
      periodLabel,
      unit: {
        zelle_handle: unit.zelle_handle,
        cashapp_handle: unit.cashapp_handle,
        payment_instructions: unit.payment_instructions,
      },
    });

    const results = await sendRentReminder({
      template,
      profileId: lease.tenant_id,
      leaseId: lease.id,
      invoiceId: inv.id,
      email: profile?.email ?? lease.tenant_email,
      phone: profile?.phone ?? null,
      notifyEmail: profile?.notify_email ?? true,
      notifySms: profile?.notify_sms ?? true,
      subject: message.subject,
      body: message.body,
      smsBody: message.sms,
    });

    sent += results.filter((r) => r.ok).length;
  }

  return { ok: true, sent, checked: invoices?.length ?? 0 };
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runReminders();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runReminders();
  return NextResponse.json(result);
}
