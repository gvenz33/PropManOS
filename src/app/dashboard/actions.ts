"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createProperty(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { error } = await supabase.from("properties").insert({
    owner_id: user.id,
    name,
    address_line1: String(formData.get("address_line1") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    state: String(formData.get("state") ?? "").trim() || null,
    postal_code: String(formData.get("postal_code") ?? "").trim() || null,
  });
  if (error) return;
  revalidatePath("/dashboard/owner/properties");
}

export async function createUnit(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const propertyId = String(formData.get("property_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rent = Number(formData.get("rent_amount_cents") ?? 0);
  const dueDay = Number(formData.get("due_day_of_month") ?? 1);
  const lateFee = Number(formData.get("late_fee_cents") ?? 0);
  const grace = Number(formData.get("grace_days") ?? 0);
  if (!propertyId || !label || !rent || rent < 0) return;

  const { error } = await supabase.from("units").insert({
    property_id: propertyId,
    label,
    rent_amount_cents: Math.round(rent),
    due_day_of_month: Math.min(28, Math.max(1, dueDay)),
    late_fee_cents: Math.max(0, Math.round(lateFee)),
    grace_days: Math.max(0, Math.round(grace)),
    bank_connection_note: String(formData.get("bank_connection_note") ?? "").trim() || null,
  });
  if (error) return;
  revalidatePath(`/dashboard/owner/properties/${propertyId}`);
}

export async function createLease(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const unitId = String(formData.get("unit_id") ?? "");
  const tenantEmail = String(formData.get("tenant_email") ?? "").trim().toLowerCase();
  const start = String(formData.get("start_date") ?? "");
  const rent = Number(formData.get("rent_amount_cents") ?? 0);
  if (!unitId || !tenantEmail || !start || rent < 0) return;

  const { error } = await supabase.from("leases").insert({
    unit_id: unitId,
    tenant_email: tenantEmail,
    rent_amount_cents: Math.round(rent),
    start_date: start,
    end_date: String(formData.get("end_date") ?? "").trim() || null,
    status: "active",
  });
  if (error) return;
  revalidatePath("/dashboard/owner/properties");
}

export async function generateMonthlyInvoicesForm() {
  await generateMonthlyInvoices();
}

export async function applyLateFeesForm() {
  await applyLateFees();
}

export async function generateMonthlyInvoices() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const { data: properties, error: pErr } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", user.id);
  if (pErr) return { error: pErr.message };
  const propIds = (properties ?? []).map((p) => p.id);
  if (propIds.length === 0) return { ok: true, count: 0 };

  const { data: units, error: uErr } = await supabase
    .from("units")
    .select("id, due_day_of_month")
    .in("property_id", propIds);
  if (uErr) return { error: uErr.message };
  const unitMap = new Map((units ?? []).map((u) => [u.id, u.due_day_of_month]));
  const unitIds = [...unitMap.keys()];
  if (unitIds.length === 0) return { ok: true, count: 0 };

  const { data: leases, error: leErr } = await supabase
    .from("leases")
    .select("id, rent_amount_cents, unit_id")
    .in("unit_id", unitIds)
    .eq("status", "active");
  if (leErr) return { error: leErr.message };

  let count = 0;
  for (const lease of leases ?? []) {
    const day = unitMap.get(lease.unit_id) ?? 1;
    const lastDom = new Date(y, m, 0).getDate();
    const dueStr = `${y}-${String(m).padStart(2, "0")}-${String(Math.min(day, lastDom)).padStart(2, "0")}`;

    const { error: invErr } = await supabase.from("invoices").upsert(
      {
        lease_id: lease.id,
        period_year: y,
        period_month: m,
        amount_cents: lease.rent_amount_cents,
        due_date: dueStr,
        status: "open",
      },
      { onConflict: "lease_id,period_year,period_month" },
    );
    if (invErr) return { error: invErr.message };
    count += 1;
  }

  revalidatePath("/dashboard/owner/invoices");
  return { ok: true, count };
}

export async function waiveLateFee(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ late_fee_waived: true, late_fee_cents: 0 })
    .eq("id", invoiceId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/owner/invoices");
  return { ok: true };
}

export async function waiveLateFeeForm(formData: FormData) {
  const id = String(formData.get("invoice_id") ?? "");
  if (!id) return;
  await waiveLateFee(id);
}

export async function markInvoicePaid(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), late_fee_cents: 0 })
    .eq("id", invoiceId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/owner/invoices");
  revalidatePath("/dashboard/tenant");
  return { ok: true };
}

export async function markInvoicePaidForm(formData: FormData) {
  const id = String(formData.get("invoice_id") ?? "");
  if (!id) return;
  await markInvoicePaid(id);
}

export async function applyLateFees() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", user.id);
  const propIds = (properties ?? []).map((p) => p.id);
  if (propIds.length === 0) return { ok: true };

  const { data: units } = await supabase
    .from("units")
    .select("id, late_fee_cents, grace_days")
    .in("property_id", propIds);
  const unitById = new Map((units ?? []).map((u) => [u.id, u]));
  const unitIds = [...unitById.keys()];
  if (unitIds.length === 0) return { ok: true };

  const { data: leases } = await supabase
    .from("leases")
    .select("id, unit_id")
    .in("unit_id", unitIds)
    .eq("status", "active");
  const leaseIds = (leases ?? []).map((l) => l.id);
  if (leaseIds.length === 0) return { ok: true };

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, due_date, status, late_fee_waived, lease_id")
    .in("lease_id", leaseIds)
    .eq("status", "open")
    .eq("late_fee_waived", false);

  if (error) return { error: error.message };

  const leaseUnit = new Map((leases ?? []).map((l) => [l.id, l.unit_id]));
  const now = new Date();

  for (const inv of invoices ?? []) {
    const unitId = leaseUnit.get(inv.lease_id);
    if (!unitId) continue;
    const unit = unitById.get(unitId);
    if (!unit) continue;
    const due = new Date(`${inv.due_date}T12:00:00`);
    const lateAfter = new Date(due.getTime() + (unit.grace_days ?? 0) * 86400000);
    if (now <= lateAfter) continue;
    const fee = unit.late_fee_cents ?? 0;
    if (fee <= 0) {
      await supabase.from("invoices").update({ status: "late" }).eq("id", inv.id);
    } else {
      await supabase
        .from("invoices")
        .update({ status: "late", late_fee_cents: fee })
        .eq("id", inv.id);
    }
  }
  revalidatePath("/dashboard/owner/invoices");
  return { ok: true };
}

export async function createCrmContact(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { error } = await supabase.from("crm_contacts").insert({
    owner_id: user.id,
    name,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) return;
  revalidatePath("/dashboard/owner/crm");
}

export async function createCrmActivity(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const title = String(formData.get("title") ?? "").trim();
  const contactRaw = String(formData.get("contact_id") ?? "").trim();
  const contactId = contactRaw.length ? contactRaw : null;
  if (!title) return;
  const { error } = await supabase.from("crm_activities").insert({
    owner_id: user.id,
    contact_id: contactId,
    title,
    activity_type: String(formData.get("activity_type") ?? "note"),
    due_at: String(formData.get("due_at") ?? "").trim() || null,
  });
  if (error) return;
  revalidatePath("/dashboard/owner/crm");
}

export async function registerDocument(params: {
  leaseId: string | null;
  unitId: string | null;
  storagePath: string;
  filename: string;
  kind: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { error } = await supabase.from("documents").insert({
    owner_id: user.id,
    uploaded_by: user.id,
    lease_id: params.leaseId,
    unit_id: params.unitId,
    storage_path: params.storagePath,
    filename: params.filename,
    kind: params.kind,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/owner/documents");
  return { ok: true };
}
