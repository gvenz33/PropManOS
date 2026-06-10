"use server";

import { BRAND } from "@/lib/brand";
import { documentKindLabel } from "@/lib/documents";
import { parseDollarsToCents } from "@/lib/money";
import { isRepairPriority, isRepairStatus } from "@/lib/repair-requests";
import { sendEmail, sendSms } from "@/lib/notifications/outbound";
import { PROP_MAN_STORAGE_BUCKET } from "@/lib/supabase/storage";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function propertiesPath(query?: string) {
  return `/dashboard/owner/properties${query ? `?${query}` : ""}`;
}

function propertyPath(propertyId: string, query?: string, anchor = "") {
  const base = `/dashboard/owner/properties/${propertyId}${query ? `?${query}` : ""}`;
  return anchor ? `${base}#${anchor}` : base;
}

const unitsSection = "units-tenants";

function unitPath(propertyId: string, unitId: string, query?: string) {
  return `/dashboard/owner/properties/${propertyId}/units/${unitId}${query ? `?${query}` : ""}`;
}

function tenantPath(propertyId: string, leaseId: string, query?: string) {
  return `/dashboard/owner/properties/${propertyId}/tenants/${leaseId}${query ? `?${query}` : ""}`;
}

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
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(propertiesPath(`error=${encodeURIComponent("Property name is required.")}`));
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      name,
      address_line1: String(formData.get("address_line1") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      state: String(formData.get("state") ?? "").trim() || null,
      postal_code: String(formData.get("postal_code") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(propertiesPath(`error=${encodeURIComponent(error?.message ?? "Could not save property.")}`));
  }

  revalidatePath("/dashboard/owner/properties");
  redirect(propertyPath(data.id, "success=property", unitsSection));
}

export async function updateProperty(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!propertyId || !name) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent("Property name is required.")}`));
  }

  const { error } = await supabase
    .from("properties")
    .update({
      name,
      address_line1: String(formData.get("address_line1") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      state: String(formData.get("state") ?? "").trim() || null,
      postal_code: String(formData.get("postal_code") ?? "").trim() || null,
    })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath(propertyPath(propertyId));
  redirect(propertyPath(propertyId, "success=property"));
}

export async function createUnit(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const propertyId = String(formData.get("property_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const rent = parseDollarsToCents(formData.get("rent_amount_dollars"));
  const lateFee = parseDollarsToCents(formData.get("late_fee_dollars")) ?? 0;
  const dueDay = Number(formData.get("due_day_of_month") ?? 1);
  const grace = Number(formData.get("grace_days") ?? 0);

  if (!propertyId || !label) {
    redirect(propertyPath(propertyId || "", `error=${encodeURIComponent("Unit label is required.")}`));
  }
  if (rent === null || rent <= 0) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent("Enter a valid monthly rent.")}`));
  }

  const { error } = await supabase.from("units").insert({
    property_id: propertyId,
    label,
    rent_amount_cents: rent,
    due_day_of_month: Math.min(28, Math.max(1, dueDay)),
    late_fee_cents: Math.max(0, lateFee),
    grace_days: Math.max(0, Math.round(grace)),
    zelle_handle: String(formData.get("zelle_handle") ?? "").trim() || null,
    cashapp_handle: String(formData.get("cashapp_handle") ?? "").trim() || null,
    payment_instructions: String(formData.get("payment_instructions") ?? "").trim() || null,
  });
  if (error) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  redirect(propertyPath(propertyId, "success=unit", unitsSection));
}

export async function updateUnitPayments(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const unitId = String(formData.get("unit_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!unitId || !propertyId) {
    redirect(propertiesPath(`error=${encodeURIComponent("Missing unit information.")}`));
  }

  const { error } = await supabase
    .from("units")
    .update({
      zelle_handle: String(formData.get("zelle_handle") ?? "").trim() || null,
      cashapp_handle: String(formData.get("cashapp_handle") ?? "").trim() || null,
      payment_instructions: String(formData.get("payment_instructions") ?? "").trim() || null,
    })
    .eq("id", unitId);

  const returnToProperty = String(formData.get("return_to") ?? "") === "property";

  if (error) {
    if (returnToProperty) {
      redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`, unitsSection));
    }
    redirect(unitPath(propertyId, unitId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  revalidatePath(unitPath(propertyId, unitId));
  if (returnToProperty) {
    redirect(propertyPath(propertyId, "success=payments", unitsSection));
  }
  redirect(unitPath(propertyId, unitId, "success=payments"));
}

export async function updateTenantNotifications(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      phone: String(formData.get("phone") ?? "").trim() || null,
      notify_email: formData.has("notify_email"),
      notify_sms: formData.has("notify_sms"),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/dashboard/tenant/settings?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/dashboard/tenant/settings");
  redirect("/dashboard/tenant/settings?success=settings");
}

export async function createLease(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const unitId = String(formData.get("unit_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  const tenantEmail = String(formData.get("tenant_email") ?? "").trim().toLowerCase();
  const start = String(formData.get("start_date") ?? "");
  const rent = parseDollarsToCents(formData.get("rent_amount_dollars"));

  if (!unitId || !propertyId) {
    redirect(propertiesPath(`error=${encodeURIComponent("Missing unit information.")}`));
  }
  if (!tenantEmail) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent("Tenant email is required.")}`));
  }
  if (!start) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent("Lease start date is required.")}`));
  }
  if (rent === null || rent < 0) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent("Enter a valid rent amount.")}`));
  }

  const { error } = await supabase.from("leases").insert({
    unit_id: unitId,
    tenant_email: tenantEmail,
    tenant_name: String(formData.get("tenant_name") ?? "").trim() || null,
    tenant_phone: String(formData.get("tenant_phone") ?? "").trim() || null,
    rent_amount_cents: rent,
    start_date: start,
    end_date: String(formData.get("end_date") ?? "").trim() || null,
    status: "active",
  });
  if (error) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  redirect(propertyPath(propertyId, "success=lease", unitsSection));
}

export async function updateLeaseContact(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const leaseId = String(formData.get("lease_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  const tenantEmail = String(formData.get("tenant_email") ?? "").trim().toLowerCase();

  if (!leaseId || !propertyId) {
    redirect(propertiesPath(`error=${encodeURIComponent("Missing lease information.")}`));
  }
  if (!tenantEmail) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent("Tenant email is required.")}`));
  }

  const { error } = await supabase
    .from("leases")
    .update({
      tenant_email: tenantEmail,
      tenant_name: String(formData.get("tenant_name") ?? "").trim() || null,
      tenant_phone: String(formData.get("tenant_phone") ?? "").trim() || null,
    })
    .eq("id", leaseId)
    .eq("status", "active");

  if (error) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  revalidatePath(tenantPath(propertyId, leaseId));
  redirect(propertyPath(propertyId, "success=lease-updated", unitsSection));
}

export async function updateLease(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const leaseId = String(formData.get("lease_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  const tenantEmail = String(formData.get("tenant_email") ?? "").trim().toLowerCase();
  const start = String(formData.get("start_date") ?? "");
  const rent = parseDollarsToCents(formData.get("rent_amount_dollars"));

  if (!leaseId || !propertyId) {
    redirect(propertiesPath(`error=${encodeURIComponent("Missing lease information.")}`));
  }
  if (!tenantEmail) {
    redirect(tenantPath(propertyId, leaseId, `error=${encodeURIComponent("Tenant email is required.")}`));
  }
  if (!start) {
    redirect(tenantPath(propertyId, leaseId, `error=${encodeURIComponent("Lease start date is required.")}`));
  }
  if (rent === null || rent < 0) {
    redirect(tenantPath(propertyId, leaseId, `error=${encodeURIComponent("Enter a valid rent amount.")}`));
  }

  const { error } = await supabase
    .from("leases")
    .update({
      tenant_email: tenantEmail,
      tenant_name: String(formData.get("tenant_name") ?? "").trim() || null,
      tenant_phone: String(formData.get("tenant_phone") ?? "").trim() || null,
      rent_amount_cents: rent,
      start_date: start,
      end_date: String(formData.get("end_date") ?? "").trim() || null,
    })
    .eq("id", leaseId)
    .eq("status", "active");

  if (error) {
    redirect(tenantPath(propertyId, leaseId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  revalidatePath(tenantPath(propertyId, leaseId));
  redirect(tenantPath(propertyId, leaseId, "success=lease-updated"));
}

export async function endLease(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const leaseId = String(formData.get("lease_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!leaseId || !propertyId) {
    redirect(propertiesPath(`error=${encodeURIComponent("Missing lease information.")}`));
  }

  const { error } = await supabase
    .from("leases")
    .update({
      status: "ended",
      end_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", leaseId);

  if (error) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  redirect(propertyPath(propertyId, "success=lease-ended", unitsSection));
}

export async function removeTenantFromUnit(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const leaseId = String(formData.get("lease_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!leaseId || !propertyId) {
    redirect(propertiesPath(`error=${encodeURIComponent("Missing lease information.")}`));
  }

  const { count: paidCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("lease_id", leaseId)
    .eq("status", "paid");

  if ((paidCount ?? 0) > 0) {
    redirect(
      propertyPath(
        propertyId,
        `error=${encodeURIComponent("Cannot remove a tenant with paid invoices. Use End lease to close the tenancy instead.")}`,
      ),
    );
  }

  const { error } = await supabase
    .from("leases")
    .delete()
    .eq("id", leaseId)
    .eq("status", "active");

  if (error) {
    redirect(propertyPath(propertyId, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath(propertyPath(propertyId));
  redirect(propertyPath(propertyId, "success=tenant-removed", unitsSection));
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
  propertyId: string | null;
  unitId?: string | null;
  leaseId?: string | null;
  category: "internal" | "rental_form";
  storagePath: string;
  filename: string;
  kind: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  let propertyId = params.propertyId;
  let unitId = params.unitId ?? null;
  let leaseId = params.leaseId ?? null;

  if (leaseId) {
    const { data: lease } = await supabase
      .from("leases")
      .select("id, unit_id")
      .eq("id", leaseId)
      .maybeSingle();
    if (!lease) return { error: "Tenant not found." };
    unitId = lease.unit_id;
    const { data: unit } = await supabase
      .from("units")
      .select("property_id")
      .eq("id", lease.unit_id)
      .maybeSingle();
    if (!unit) return { error: "Unit not found." };
    propertyId = unit.property_id;
    const { data: ownedProperty } = await supabase
      .from("properties")
      .select("id")
      .eq("id", unit.property_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!ownedProperty) return { error: "Tenant not found." };
  } else if (unitId) {
    const { data: unit } = await supabase
      .from("units")
      .select("property_id")
      .eq("id", unitId)
      .maybeSingle();
    if (!unit) return { error: "Unit not found." };
    propertyId = unit.property_id;
    const { data: ownedProperty } = await supabase
      .from("properties")
      .select("id")
      .eq("id", unit.property_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!ownedProperty) return { error: "Unit not found." };
  } else if (propertyId) {
    const { data: property } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!property) return { error: "Property not found." };
  }

  const { error } = await supabase.from("documents").insert({
    owner_id: user.id,
    uploaded_by: user.id,
    property_id: propertyId,
    lease_id: leaseId,
    unit_id: unitId,
    storage_path: params.storagePath,
    filename: params.filename,
    kind: params.kind,
    category: params.category,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/owner/documents");
  if (propertyId) {
    revalidatePath(propertyPath(propertyId));
    if (unitId) revalidatePath(unitPath(propertyId, unitId));
    if (leaseId) revalidatePath(tenantPath(propertyId, leaseId));
  }
  revalidatePath("/dashboard/tenant/documents");
  return { ok: true };
}

const FORM_LINK_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function sendRentalFormAction(formData: FormData): Promise<{
  error?: string;
  sent?: { channel: string; ok: boolean; error?: string }[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const documentId = String(formData.get("document_id") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "").trim();
  const recipientEmail = String(formData.get("recipient_email") ?? "").trim();
  const recipientPhone = String(formData.get("recipient_phone") ?? "").trim();
  const recipientName = String(formData.get("recipient_name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const sendEmailChannel = formData.get("send_email") === "on";
  const sendSmsChannel = formData.get("send_sms") === "on";

  if (!documentId || !propertyId) return { error: "Missing form information." };
  if (!sendEmailChannel && !sendSmsChannel) {
    return { error: "Choose email, text, or both." };
  }
  if (sendEmailChannel && !recipientEmail) return { error: "Email is required to send by email." };
  if (sendSmsChannel && !recipientPhone) return { error: "Phone is required to send by text." };

  const { data: doc } = await supabase
    .from("documents")
    .select("id, filename, kind, storage_path, category, properties(name)")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .eq("property_id", propertyId)
    .eq("category", "rental_form")
    .maybeSingle();

  if (!doc) return { error: "Rental form not found." };

  const service = createServiceClient();
  if (!service) return { error: "File delivery is not configured." };

  const { data: signed, error: signError } = await service.storage
    .from(PROP_MAN_STORAGE_BUCKET)
    .createSignedUrl(doc.storage_path, FORM_LINK_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    return { error: signError?.message ?? "Could not create download link." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const propertyRaw = doc.properties as { name: string } | { name: string }[] | null;
  const propertyName = Array.isArray(propertyRaw) ? propertyRaw[0]?.name : propertyRaw?.name;
  const landlordName = profile?.full_name?.trim() || "Your landlord";
  const greeting = recipientName ? `Hi ${recipientName},` : "Hello,";
  const formLabel = documentKindLabel(doc.kind);
  const defaultMessage = `Please review the attached ${formLabel.toLowerCase()} for ${propertyName ?? "the property"}.`;
  const note = message || defaultMessage;

  const emailBody = `${greeting}

${note}

Download ${doc.filename} (link valid 7 days):
${signed.signedUrl}

— ${landlordName} via ${BRAND.name}`;

  const smsBody = `${landlordName} sent you ${doc.filename} for ${propertyName ?? "a rental"}: ${signed.signedUrl}`;

  const sent: { channel: string; ok: boolean; error?: string }[] = [];

  if (sendEmailChannel) {
    const result = await sendEmail(
      recipientEmail,
      `${formLabel} — ${propertyName ?? BRAND.name}`,
      emailBody,
    );
    if (result.ok) {
      await supabase.from("document_sends").insert({
        document_id: documentId,
        owner_id: user.id,
        property_id: propertyId,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone || null,
        channel: "email",
        message: note,
      });
    }
    sent.push({ channel: "email", ...result });
  }

  if (sendSmsChannel) {
    const result = await sendSms(recipientPhone, smsBody);
    if (result.ok) {
      await supabase.from("document_sends").insert({
        document_id: documentId,
        owner_id: user.id,
        property_id: propertyId,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        recipient_phone: recipientPhone,
        channel: "sms",
        message: note,
      });
    }
    sent.push({ channel: "sms", ...result });
  }

  revalidatePath(propertyPath(propertyId));
  return { sent };
}

export async function createRepairRequest(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const leaseId = String(formData.get("lease_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "normal");

  if (!leaseId || !title || !description) {
    redirect(
      `/dashboard/tenant/repairs?error=${encodeURIComponent("Title and description are required.")}`,
    );
  }
  if (!isRepairPriority(priority)) {
    redirect(`/dashboard/tenant/repairs?error=${encodeURIComponent("Invalid priority.")}`);
  }

  const { data: lease } = await supabase
    .from("leases")
    .select("id")
    .eq("id", leaseId)
    .eq("tenant_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!lease) {
    redirect(`/dashboard/tenant/repairs?error=${encodeURIComponent("Invalid lease selected.")}`);
  }

  const { error } = await supabase.from("repair_requests").insert({
    lease_id: leaseId,
    tenant_id: user.id,
    title,
    description,
    location,
    priority,
  });

  if (error) {
    redirect(`/dashboard/tenant/repairs?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/tenant/repairs");
  revalidatePath("/dashboard/owner/repairs");
  redirect("/dashboard/tenant/repairs?success=submitted");
}

export async function updateRepairRequestStatus(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("repair_request_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !isRepairStatus(status)) return;

  const { error } = await supabase.from("repair_requests").update({ status }).eq("id", id);
  if (error) return;

  revalidatePath("/dashboard/owner/repairs");
  revalidatePath("/dashboard/tenant/repairs");
}
