import { isPlaidConfigured } from "@/lib/plaid/client";
import { payInvoiceWithPlaid } from "@/lib/plaid/transfers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type Body = { invoice_id?: string };

export async function POST(request: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "tenant") {
    return NextResponse.json({ error: "Only tenants can pay invoices" }, { status: 403 });
  }

  const body = (await request.json()) as Body;
  const invoiceId = body.invoice_id?.trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice required" }, { status: 400 });
  }

  const result = await payInvoiceWithPlaid({
    invoiceId,
    tenantId: user.id,
    tenantName: profile.full_name || user.email || "Tenant",
    tenantEmail: profile?.email ?? user.email ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/dashboard/tenant/invoices");
  revalidatePath("/dashboard/tenant");
  revalidatePath("/dashboard/owner/invoices");

  return NextResponse.json({
    ok: true,
    ach_payment_id: result.achPaymentId,
    transfer_id: result.transferId,
  });
}
