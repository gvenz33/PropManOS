import { ACHClass, TransferNetwork, TransferType } from "plaid";
import { createServiceClient } from "@/lib/supabase/service";
import { centsToPlaidAmount, invoiceTotals } from "./fees";
import { getPlaidClient } from "./client";
import {
  getActiveBankConnectionWithToken,
} from "./bank-connections";

type PayInvoiceResult =
  | { ok: true; achPaymentId: string; transferId: string }
  | { ok: false; error: string };

export async function payInvoiceWithPlaid(input: {
  invoiceId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
}): Promise<PayInvoiceResult> {
  const service = createServiceClient();
  if (!service) return { ok: false, error: "Payments are not configured" };

  const { data: invoice, error: invoiceError } = await service
    .from("invoices")
    .select(
      "id, lease_id, amount_cents, late_fee_cents, late_fee_waived, status, leases(tenant_id, units(properties(owner_id)))",
    )
    .eq("id", input.invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return { ok: false, error: "Invoice not found" };
  }
  if (invoice.status === "paid") {
    return { ok: false, error: "Invoice is already paid" };
  }

  type LeaseShape = {
    tenant_id: string | null;
    units:
      | { properties: { owner_id: string } | { owner_id: string }[] }
      | { properties: { owner_id: string } | { owner_id: string }[] }[];
  };
  const leaseRaw = invoice.leases as unknown as LeaseShape | LeaseShape[] | null;
  const lease = Array.isArray(leaseRaw) ? leaseRaw[0] : leaseRaw;
  if (!lease || lease.tenant_id !== input.tenantId) {
    return { ok: false, error: "You cannot pay this invoice" };
  }

  const unitRaw = lease.units;
  const unit = Array.isArray(unitRaw) ? unitRaw[0] : unitRaw;
  const propRaw = unit?.properties;
  const property = Array.isArray(propRaw) ? propRaw[0] : propRaw;
  const ownerId = property?.owner_id;
  if (!ownerId) {
    return { ok: false, error: "Landlord account not found" };
  }

  const tenantBank = await getActiveBankConnectionWithToken(
    input.tenantId,
    "payment",
  );
  const ownerBank = await getActiveBankConnectionWithToken(ownerId, "payout");
  if (!tenantBank) {
    return { ok: false, error: "Connect your bank account before paying" };
  }
  if (!ownerBank) {
    return {
      ok: false,
      error: "Your landlord has not connected a bank account for ACH yet",
    };
  }

  const totals = invoiceTotals(invoice);

  try {
    const plaid = getPlaidClient();

    const authorization = await plaid.transferAuthorizationCreate({
    access_token: tenantBank.plaid_access_token,
    account_id: tenantBank.plaid_account_id,
    type: TransferType.Debit,
    network: TransferNetwork.Ach,
    amount: centsToPlaidAmount(totals.totalDebitCents),
    ach_class: ACHClass.Web,
    user: {
      legal_name: input.tenantName || "Tenant",
      email_address: input.tenantEmail,
    },
  });

  const decision = authorization.data.authorization.decision;
  if (decision !== "approved") {
    return {
      ok: false,
      error:
        authorization.data.authorization.decision_rationale?.description ??
        "Bank transfer was not approved",
    };
  }

  const debitTransfer = await plaid.transferCreate({
    access_token: tenantBank.plaid_access_token,
    account_id: tenantBank.plaid_account_id,
    authorization_id: authorization.data.authorization.id,
    description: "Got My Rent payment",
  });

  const creditAuthorization = await plaid.transferAuthorizationCreate({
    access_token: ownerBank.plaid_access_token,
    account_id: ownerBank.plaid_account_id,
    type: TransferType.Credit,
    network: TransferNetwork.Ach,
    amount: centsToPlaidAmount(totals.ownerCreditCents),
    ach_class: ACHClass.Web,
    user: {
      legal_name: "Landlord",
    },
  });

  if (creditAuthorization.data.authorization.decision === "approved") {
    await plaid.transferCreate({
      access_token: ownerBank.plaid_access_token,
      account_id: ownerBank.plaid_account_id,
      authorization_id: creditAuthorization.data.authorization.id,
      description: "Got My Rent payout",
    });
  }

  const { data: achPayment, error: achError } = await service
    .from("ach_payments")
    .insert({
      invoice_id: invoice.id,
      tenant_id: input.tenantId,
      owner_id: ownerId,
      rent_amount_cents: totals.rentAmountCents,
      late_fee_cents: totals.lateFeeCents,
      platform_fee_cents: totals.platformFeeCents,
      total_debit_cents: totals.totalDebitCents,
      plaid_transfer_id: debitTransfer.data.transfer.id,
      status: "posted",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (achError || !achPayment) {
    return { ok: false, error: achError?.message ?? "Could not record payment" };
  }

  const { error: updateError } = await service
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      platform_fee_cents: totals.platformFeeCents,
    })
    .eq("id", invoice.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return {
    ok: true,
    achPaymentId: achPayment.id,
    transferId: debitTransfer.data.transfer.id,
  };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Bank transfer failed. Check your Plaid sandbox credentials.";
    return { ok: false, error: message };
  }
}
