import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BRAND } from "@/lib/brand";
import type { NoticeType } from "@/lib/documents";
import { formatMoney } from "@/lib/utils";

export type NoticeDocumentData = {
  noticeType: NoticeType;
  noticeDate: string;
  complianceDate: string;
  landlordName: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  propertyAddress: string | null;
  unitLabel: string;
  rentCents: number;
  amountOwedCents: number | null;
  additionalNotes: string | null;
};

type UnitShape = {
  label: string;
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
  rent_amount_cents: number;
  units: UnitShape | UnitShape[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
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

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function fetchNoticeDocumentData(
  supabase: SupabaseClient,
  leaseId: string,
  noticeType: NoticeType,
  options: {
    noticeDate: string;
    amountOwedCents?: number | null;
    additionalNotes?: string | null;
  },
): Promise<NoticeDocumentData | null> {
  const { data: lease } = await supabase
    .from("leases")
    .select(
      "tenant_email, tenant_name, rent_amount_cents, units(label, properties(name, address_line1, city, state, postal_code, owner_id))",
    )
    .eq("id", leaseId)
    .maybeSingle();

  if (!lease) return null;

  const leaseShape = lease as unknown as LeaseShape;
  const unit = first(leaseShape.units);
  const property = first(unit?.properties);
  if (!unit || !property) return null;

  let landlordName = "Landlord / Property Manager";
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", property.owner_id)
    .maybeSingle();
  if (ownerProfile?.full_name?.trim()) landlordName = ownerProfile.full_name.trim();

  const complianceDays = noticeType === "3_day" ? 3 : noticeType === "30_day" ? 30 : 60;
  const complianceDate = addDays(options.noticeDate, complianceDays);

  return {
    noticeType,
    noticeDate: options.noticeDate,
    complianceDate,
    landlordName,
    tenantName: leaseShape.tenant_name?.trim() || leaseShape.tenant_email,
    tenantEmail: leaseShape.tenant_email,
    propertyName: property.name,
    propertyAddress: joinAddress(property),
    unitLabel: unit.label,
    rentCents: leaseShape.rent_amount_cents,
    amountOwedCents:
      noticeType === "3_day"
        ? (options.amountOwedCents ?? leaseShape.rent_amount_cents)
        : null,
    additionalNotes: options.additionalNotes?.trim() || null,
  };
}

const NAVY = rgb(0.059, 0.161, 0.259);
const GRAY = rgb(0.39, 0.45, 0.55);
const LIGHT = rgb(0.878, 0.949, 0.996);

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function noticeTitle(type: NoticeType) {
  if (type === "3_day") return "THREE-DAY NOTICE TO PAY RENT OR QUIT";
  if (type === "30_day") return "THIRTY-DAY NOTICE TO TERMINATE TENANCY";
  return "SIXTY-DAY NOTICE TO TERMINATE TENANCY";
}

function noticeBody(data: NoticeDocumentData) {
  const premises = [
    data.propertyName,
    data.propertyAddress ? data.propertyAddress : null,
    `Unit ${data.unitLabel}`,
  ]
    .filter(Boolean)
    .join(", ");

  if (data.noticeType === "3_day") {
    const owed = data.amountOwedCents ?? data.rentCents;
    return [
      `TO: ${data.tenantName}`,
      `RE: Premises at ${premises}`,
      "",
      `You are hereby notified that rent in the amount of ${formatMoney(owed)} is now due and unpaid for the above-described premises.`,
      `Within three (3) days after service of this notice, you must pay the full amount due or deliver possession of the premises to the landlord.`,
      `If you fail to do so, legal proceedings may be commenced to recover possession of the premises, unpaid rent, and other lawful damages.`,
      "",
      `Monthly rent under the tenancy: ${formatMoney(data.rentCents)}.`,
    ];
  }

  const days = data.noticeType === "30_day" ? "thirty (30)" : "sixty (60)";
  return [
    `TO: ${data.tenantName}`,
    `RE: Premises at ${premises}`,
    "",
    `You are hereby notified that your tenancy of the above-described premises is terminated effective ${formatDisplayDate(data.complianceDate)}.`,
    `You are required to deliver possession of the premises to the landlord on or before that date.`,
    `This notice is given with at least ${days} days' notice as required for the termination of your tenancy.`,
    "",
    `Monthly rent under the tenancy: ${formatMoney(data.rentCents)}.`,
  ];
}

export function noticeFilename(data: NoticeDocumentData) {
  const slug = data.noticeType.replace("_", "-");
  const tenant = data.tenantName.replace(/[^\w.-]+/g, "_").slice(0, 40);
  return `${slug}-notice-${tenant}.pdf`;
}

export async function buildNoticePdf(data: NoticeDocumentData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const left = 54;
  const right = width - 54;
  const contentWidth = right - left;

  const text = (
    value: string,
    x: number,
    y: number,
    size = 10,
    f = font,
    color = NAVY,
  ) => page.drawText(value, { x, y, size, font: f, color });

  page.drawRectangle({ x: 0, y: 712, width, height: 80, color: NAVY });
  text(BRAND.name, left, 748, 20, bold, rgb(1, 1, 1));
  text("Rental notice", left, 730, 10, font, LIGHT);

  let y = 680;
  text(noticeTitle(data.noticeType), left, y, 14, bold);
  y -= 24;
  text(`Notice date: ${formatDisplayDate(data.noticeDate)}`, left, y, 10, font, GRAY);
  y -= 14;
  text(`Compliance / move-out date: ${formatDisplayDate(data.complianceDate)}`, left, y, 10, font, GRAY);
  y -= 28;

  for (const paragraph of noticeBody(data)) {
    if (!paragraph) {
      y -= 8;
      continue;
    }
    for (const line of wrapText(paragraph, font, 10, contentWidth)) {
      text(line, left, y, 10, font);
      y -= 14;
    }
    y -= 4;
  }

  if (data.additionalNotes) {
    y -= 8;
    text("Additional terms / notes", left, y, 10, bold);
    y -= 16;
    for (const line of wrapText(data.additionalNotes, font, 10, contentWidth)) {
      text(line, left, y, 10, font);
      y -= 14;
    }
  }

  y -= 24;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: GRAY,
  });
  y -= 28;
  text("Landlord / authorized agent", left, y, 9, bold, GRAY);
  y -= 18;
  text(data.landlordName, left, y, 11, bold);
  y -= 14;
  text(`Tenant: ${data.tenantName} (${data.tenantEmail})`, left, y, 9, font, GRAY);

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
