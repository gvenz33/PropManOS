import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/utils";
import { computeInvoice, periodLabel, statusLabel } from "./compute";

export type InvoiceDocumentData = {
  invoiceId: string;
  invoiceNumber: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  status: string;
  statusLabel: string;
  dueDate: string;
  paidAt: string | null;
  landlordName: string;
  propertyName: string;
  propertyAddress: string | null;
  unitLabel: string;
  tenantName: string;
  tenantEmail: string;
  rentCents: number;
  lateFeeCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  paymentInstructions: string | null;
  zelleHandle: string | null;
  cashappHandle: string | null;
};

type UnitShape = {
  label: string;
  zelle_handle: string | null;
  cashapp_handle: string | null;
  payment_instructions: string | null;
  properties:
    | {
        name: string;
        address_line1: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        owner_id: string;
      }
    | {
        name: string;
        address_line1: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        owner_id: string;
      }[]
    | null;
};

type LeaseShape = {
  tenant_email: string;
  tenant_name: string | null;
  units: UnitShape | UnitShape[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function buildInvoiceNumber(year: number, month: number, id: string) {
  return `INV-${year}${String(month).padStart(2, "0")}-${id.slice(0, 6).toUpperCase()}`;
}

function joinAddress(p: {
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}) {
  const parts = [p.address_line1, [p.city, p.state].filter(Boolean).join(", "), p.postal_code]
    .filter((s) => s && String(s).trim())
    .map((s) => String(s).trim());
  return parts.length ? parts.join(" · ") : null;
}

export async function fetchInvoiceDocumentData(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<InvoiceDocumentData | null> {
  const { data: inv } = await supabase
    .from("invoices")
    .select(
      "id, period_year, period_month, amount_cents, due_date, status, late_fee_cents, late_fee_waived, amount_paid_cents, paid_at, leases(tenant_email, tenant_name, units(label, zelle_handle, cashapp_handle, payment_instructions, properties(name, address_line1, city, state, postal_code, owner_id)))",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!inv) return null;

  const lease = first(inv.leases as unknown as LeaseShape | LeaseShape[] | null);
  const unit = first(lease?.units);
  const property = first(unit?.properties);
  if (!lease || !unit || !property) return null;

  let landlordName = "Your landlord";
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", property.owner_id)
    .maybeSingle();
  if (ownerProfile?.full_name?.trim()) landlordName = ownerProfile.full_name.trim();

  const money = computeInvoice(inv);

  return {
    invoiceId: inv.id,
    invoiceNumber: buildInvoiceNumber(inv.period_year, inv.period_month, inv.id),
    periodYear: inv.period_year,
    periodMonth: inv.period_month,
    periodLabel: periodLabel(inv.period_year, inv.period_month),
    status: inv.status,
    statusLabel: statusLabel(inv.status),
    dueDate: inv.due_date,
    paidAt: inv.paid_at,
    landlordName,
    propertyName: property.name,
    propertyAddress: joinAddress(property),
    unitLabel: unit.label,
    tenantName: lease.tenant_name?.trim() || lease.tenant_email,
    tenantEmail: lease.tenant_email,
    rentCents: money.rentCents,
    lateFeeCents: money.lateFeeCents,
    totalCents: money.totalCents,
    paidCents: money.paidCents,
    balanceCents: money.balanceCents,
    paymentInstructions: unit.payment_instructions,
    zelleHandle: unit.zelle_handle,
    cashappHandle: unit.cashapp_handle,
  };
}

const NAVY = rgb(0.059, 0.161, 0.259);
const BLUE = rgb(0, 0.467, 0.714);
const GRAY = rgb(0.39, 0.45, 0.55);
const LIGHT = rgb(0.878, 0.949, 0.996);

export async function buildInvoicePdf(data: InvoiceDocumentData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const left = 54;
  const right = width - 54;

  const text = (
    value: string,
    x: number,
    y: number,
    size = 10,
    f = font,
    color = NAVY,
  ) => page.drawText(value, { x, y, size, font: f, color });

  const rightText = (
    value: string,
    x: number,
    y: number,
    size = 10,
    f = font,
    color = NAVY,
  ) => {
    const w = f.widthOfTextAtSize(value, size);
    page.drawText(value, { x: x - w, y, size, font: f, color });
  };

  // Header band
  page.drawRectangle({ x: 0, y: 712, width, height: 80, color: NAVY });
  text(BRAND.name, left, 748, 22, bold, rgb(1, 1, 1));
  text(BRAND.tagline, left, 730, 10, font, LIGHT);
  rightText("INVOICE", right, 748, 20, bold, rgb(1, 1, 1));
  rightText(data.invoiceNumber, right, 730, 10, font, LIGHT);

  // Meta
  let y = 686;
  text("Billed to", left, y, 9, bold, GRAY);
  rightText("Property", right, y, 9, bold, GRAY);
  y -= 15;
  text(data.tenantName, left, y, 11, bold);
  rightText(data.propertyName, right, y, 11, bold);
  y -= 14;
  text(data.tenantEmail, left, y, 10, font, GRAY);
  rightText(`Unit ${data.unitLabel}`, right, y, 10, font, GRAY);
  if (data.propertyAddress) {
    y -= 13;
    rightText(data.propertyAddress, right, y, 9, font, GRAY);
  }

  y -= 30;
  text("Billing period", left, y, 9, bold, GRAY);
  text("Due date", left + 170, y, 9, bold, GRAY);
  text("Status", left + 320, y, 9, bold, GRAY);
  y -= 15;
  text(data.periodLabel, left, y, 11, bold);
  text(data.dueDate, left + 170, y, 11, bold);
  text(data.statusLabel, left + 320, y, 11, bold, data.balanceCents === 0 ? rgb(0.086, 0.639, 0.29) : BLUE);

  // Line items table
  y -= 34;
  page.drawRectangle({ x: left, y: y - 6, width: right - left, height: 24, color: NAVY });
  text("Description", left + 10, y, 10, bold, rgb(1, 1, 1));
  rightText("Amount", right - 10, y, 10, bold, rgb(1, 1, 1));
  y -= 24;

  const row = (label: string, cents: number, emphasize = false) => {
    const f = emphasize ? bold : font;
    text(label, left + 10, y, 10, f);
    rightText(formatMoney(cents), right - 10, y, 10, f);
    y -= 22;
    page.drawLine({
      start: { x: left, y: y + 8 },
      end: { x: right, y: y + 8 },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92),
    });
  };

  row(`Rent — ${data.periodLabel}`, data.rentCents);
  if (data.lateFeeCents > 0) row("Late fee", data.lateFeeCents);

  // Totals
  y -= 6;
  const totalsX = left + (right - left) * 0.55;
  const totalLine = (label: string, cents: number, emphasize = false, color = NAVY) => {
    const f = emphasize ? bold : font;
    text(label, totalsX, y, emphasize ? 11 : 10, f, color);
    rightText(formatMoney(cents), right - 10, y, emphasize ? 11 : 10, f, color);
    y -= 20;
  };
  totalLine("Total due", data.totalCents, true);
  if (data.paidCents > 0) totalLine("Amount paid", data.paidCents, false, rgb(0.086, 0.639, 0.29));
  page.drawLine({
    start: { x: totalsX, y: y + 8 },
    end: { x: right, y: y + 8 },
    thickness: 1,
    color: NAVY,
  });
  y -= 4;
  totalLine("Balance", data.balanceCents, true, data.balanceCents === 0 ? rgb(0.086, 0.639, 0.29) : NAVY);

  if (data.paidAt && data.balanceCents === 0) {
    y -= 4;
    text(`Paid in full on ${new Date(data.paidAt).toLocaleDateString()}`, left, y, 9, font, rgb(0.086, 0.639, 0.29));
    y -= 16;
  }

  // Payment instructions
  const instructionLines: string[] = [];
  if (data.zelleHandle) instructionLines.push(`Zelle: ${data.zelleHandle}`);
  if (data.cashappHandle) instructionLines.push(`Cash App: ${data.cashappHandle}`);
  if (data.paymentInstructions) instructionLines.push(data.paymentInstructions);

  if (instructionLines.length && data.balanceCents > 0) {
    y -= 14;
    page.drawRectangle({ x: left, y: y - instructionLines.length * 14 - 20, width: right - left, height: instructionLines.length * 14 + 30, color: LIGHT });
    text("How to pay", left + 10, y, 9, bold, NAVY);
    y -= 16;
    for (const line of instructionLines) {
      for (const wrapped of wrapText(line, font, 9, right - left - 20)) {
        text(wrapped, left + 10, y, 9, font, NAVY);
        y -= 13;
      }
    }
  }

  // Footer
  text(
    `Invoice from ${data.landlordName} · Generated by ${BRAND.name} on ${new Date().toLocaleDateString()}`,
    left,
    54,
    8,
    font,
    GRAY,
  );

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

function wrapText(value: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function invoiceFilename(data: InvoiceDocumentData) {
  const unit = data.unitLabel.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  const mm = String(data.periodMonth).padStart(2, "0");
  return `invoice-${data.periodYear}-${mm}${unit ? `-${unit}` : ""}.pdf`;
}

export function buildInvoiceEmail(data: InvoiceDocumentData): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Rent invoice — ${data.periodLabel} · ${data.propertyName}`;
  const greetingName = data.tenantName && data.tenantName !== data.tenantEmail ? data.tenantName : null;
  const greeting = greetingName ? `Hi ${greetingName},` : "Hello,";

  const balanceLine =
    data.balanceCents === 0
      ? "This invoice is paid in full — thank you!"
      : `Balance due: ${formatMoney(data.balanceCents)} (by ${data.dueDate}).`;

  const payLines: string[] = [];
  if (data.zelleHandle) payLines.push(`Zelle: ${data.zelleHandle}`);
  if (data.cashappHandle) payLines.push(`Cash App: ${data.cashappHandle}`);
  if (data.paymentInstructions) payLines.push(data.paymentInstructions);

  const text = `${greeting}

Please find your rent invoice for ${data.periodLabel} attached (${data.invoiceNumber}).

Property: ${data.propertyName} — Unit ${data.unitLabel}
Rent: ${formatMoney(data.rentCents)}${data.lateFeeCents > 0 ? `\nLate fee: ${formatMoney(data.lateFeeCents)}` : ""}
Total: ${formatMoney(data.totalCents)}${data.paidCents > 0 ? `\nAmount paid: ${formatMoney(data.paidCents)}` : ""}
${balanceLine}
${payLines.length && data.balanceCents > 0 ? `\nHow to pay:\n${payLines.map((l) => `• ${l}`).join("\n")}\n` : ""}
— ${data.landlordName} via ${BRAND.name}`;

  const rows = [
    ["Rent", formatMoney(data.rentCents)],
    ...(data.lateFeeCents > 0 ? [["Late fee", formatMoney(data.lateFeeCents)]] : []),
    ["Total due", formatMoney(data.totalCents)],
    ...(data.paidCents > 0 ? [["Amount paid", formatMoney(data.paidCents)]] : []),
  ];

  const rowsHtml = rows
    .map(
      ([label, value], idx) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f2942;${idx === rows.length - 1 ? "font-weight:700;" : ""}">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#0f2942;${idx === rows.length - 1 ? "font-weight:700;" : ""}">${value}</td></tr>`,
    )
    .join("");

  const payHtml =
    payLines.length && data.balanceCents > 0
      ? `<div style="margin-top:16px;padding:12px 16px;background:#e0f2fe;border-radius:8px;color:#0f2942;font-size:13px;"><strong>How to pay</strong><br/>${payLines
          .map((l) => escapeHtml(l))
          .join("<br/>")}</div>`
      : "";

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f2942;">
  <div style="background:#0f2942;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
    <div style="font-size:20px;font-weight:700;">${escapeHtml(BRAND.name)}</div>
    <div style="font-size:13px;color:#cfe8fb;">Rent invoice · ${escapeHtml(data.invoiceNumber)}</div>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
    <p style="margin:0 0 12px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;">Here is your rent invoice for <strong>${escapeHtml(data.periodLabel)}</strong> at ${escapeHtml(data.propertyName)} (Unit ${escapeHtml(data.unitLabel)}). A PDF copy is attached.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rowsHtml}</table>
    <div style="margin-top:16px;padding:12px 16px;background:${data.balanceCents === 0 ? "#dcfce7" : "#f1f5f9"};border-radius:8px;font-size:15px;font-weight:700;color:${data.balanceCents === 0 ? "#166534" : "#0f2942"};">
      ${data.balanceCents === 0 ? "Paid in full — thank you!" : `Balance due: ${formatMoney(data.balanceCents)} by ${escapeHtml(data.dueDate)}`}
    </div>
    ${payHtml}
    <p style="margin:20px 0 0;font-size:12px;color:#64748b;">— ${escapeHtml(data.landlordName)} via ${escapeHtml(BRAND.name)}</p>
  </div>
</div>`;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
