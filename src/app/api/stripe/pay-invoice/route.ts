import { invoiceTotals } from "@/lib/plaid/fees";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { absoluteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Card payments are not configured yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { invoiceId?: string } | null;
  const invoiceId = body?.invoiceId?.trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice." }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, amount_cents, late_fee_cents, late_fee_waived, status, leases(tenant_id, tenant_email, units(properties(owner_id)))",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  const lease = Array.isArray(invoice.leases) ? invoice.leases[0] : invoice.leases;
  if (lease?.tenant_id !== user.id) {
    return NextResponse.json({ error: "Not your invoice." }, { status: 403 });
  }
  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice already paid." }, { status: 400 });
  }

  const unit = Array.isArray(lease?.units) ? lease?.units[0] : lease?.units;
  const property = Array.isArray(unit?.properties) ? unit?.properties[0] : unit?.properties;
  const ownerId = property?.owner_id as string | undefined;

  const totals = invoiceTotals(
    {
      amount_cents: invoice.amount_cents,
      late_fee_cents: invoice.late_fee_cents,
      late_fee_waived: invoice.late_fee_waived,
    },
    "card",
  );

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? lease?.tenant_email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      type: "rent_card",
      invoice_id: invoice.id,
      tenant_id: user.id,
      owner_id: ownerId ?? "",
      rent_cents: String(totals.rentAmountCents),
      late_fee_cents: String(totals.lateFeeCents),
      fee_cents: String(totals.platformFeeCents),
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: totals.totalDebitCents,
          product_data: {
            name: "Rent payment",
            description: `Includes ${totals.cardFeePercent}% card processing fee (paid by tenant)`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: absoluteUrl("/dashboard/tenant/invoices?success=card-paid"),
    cancel_url: absoluteUrl("/dashboard/tenant/invoices?error=Card%20checkout%20canceled"),
  });

  return NextResponse.json({ url: session.url });
}
