import { BRAND } from "@/lib/brand";
import { formatMoney } from "@/lib/utils";
import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MonthlySummaryParams = {
  year: number;
  month: number;
  propertyId?: string | null;
};

type UnitRow = {
  propertyName: string;
  unitLabel: string;
  tenantName: string;
  tenantEmail: string;
  rentCents: number;
  leaseId: string | null;
  invoiceStatus: string;
  invoiceAmountCents: number;
  lateFeeCents: number;
  paidAt: string | null;
  occupied: boolean;
};

type MaintenanceRow = {
  propertyName: string;
  unitLabel: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
};

export type MonthlySummaryData = {
  periodLabel: string;
  generatedAt: string;
  managerName: string;
  units: UnitRow[];
  maintenance: MaintenanceRow[];
  totals: {
    unitCount: number;
    occupied: number;
    vacant: number;
    expectedRentCents: number;
    collectedCents: number;
    outstandingCents: number;
    paidCount: number;
    openCount: number;
    lateCount: number;
    maintenanceOpen: number;
  };
};

const NAVY = "FF0F2942";
const BLUE = "FF0077B6";
const GREEN = "FF16A34A";
const LIGHT = "FFE0F2FE";
const MUTED = "FFEEF4FA";

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export async function fetchMonthlySummaryData(
  supabase: SupabaseClient,
  ownerId: string,
  params: MonthlySummaryParams,
): Promise<MonthlySummaryData> {
  const { year, month, propertyId } = params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", ownerId)
    .maybeSingle();

  let propQuery = supabase
    .from("properties")
    .select("id, name, units(id, label, rent_amount_cents, leases(id, tenant_email, tenant_name, status, rent_amount_cents, profiles(full_name)))")
    .eq("owner_id", ownerId);

  if (propertyId) propQuery = propQuery.eq("id", propertyId);

  const { data: properties } = await propQuery;

  const leaseIds: string[] = [];
  const units: UnitRow[] = [];

  for (const property of properties ?? []) {
    const unitList = property.units as {
      id: string;
      label: string;
      rent_amount_cents: number;
      leases: {
        id: string;
        tenant_email: string;
        tenant_name: string | null;
        status: string;
        rent_amount_cents: number;
        profiles: { full_name: string } | { full_name: string }[] | null;
      }[];
    }[];

    for (const unit of unitList ?? []) {
      const activeLease = (unit.leases ?? []).find((l) => l.status === "active");
      if (activeLease) leaseIds.push(activeLease.id);

      const profileRaw = activeLease?.profiles;
      const tenantProfile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

      units.push({
        propertyName: property.name,
        unitLabel: unit.label,
        tenantName:
          tenantProfile?.full_name?.trim() ||
          activeLease?.tenant_name?.trim() ||
          "—",
        tenantEmail: activeLease?.tenant_email ?? "—",
        rentCents: activeLease?.rent_amount_cents ?? unit.rent_amount_cents,
        leaseId: activeLease?.id ?? null,
        invoiceStatus: "—",
        invoiceAmountCents: 0,
        lateFeeCents: 0,
        paidAt: null,
        occupied: Boolean(activeLease),
      });
    }
  }

  const invoiceByLease = new Map<
    string,
    {
      status: string;
      amount_cents: number;
      late_fee_cents: number;
      late_fee_waived: boolean;
      paid_at: string | null;
    }
  >();

  if (leaseIds.length) {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("lease_id, status, amount_cents, late_fee_cents, late_fee_waived, paid_at")
      .in("lease_id", leaseIds)
      .eq("period_year", year)
      .eq("period_month", month);

    for (const inv of invoices ?? []) {
      invoiceByLease.set(inv.lease_id, inv);
    }
  }

  let expectedRentCents = 0;
  let collectedCents = 0;
  let outstandingCents = 0;
  let paidCount = 0;
  let openCount = 0;
  let lateCount = 0;

  for (const unit of units) {
    if (!unit.occupied) continue;
    expectedRentCents += unit.rentCents;

    const inv = unit.leaseId ? invoiceByLease.get(unit.leaseId) : undefined;
    if (inv) {
      const late = inv.late_fee_waived ? 0 : inv.late_fee_cents;
      unit.invoiceStatus = inv.status;
      unit.invoiceAmountCents = inv.amount_cents;
      unit.lateFeeCents = late;
      unit.paidAt = inv.paid_at;

      if (inv.status === "paid") {
        paidCount += 1;
        collectedCents += inv.amount_cents;
      } else {
        outstandingCents += inv.amount_cents + late;
        if (inv.status === "late") lateCount += 1;
        else openCount += 1;
      }
    } else {
      unit.invoiceStatus = "no invoice";
      outstandingCents += unit.rentCents;
      openCount += 1;
    }
  }

  const maintenance: MaintenanceRow[] = [];
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  if (leaseIds.length) {
    const { data: repairs } = await supabase
      .from("repair_requests")
      .select(
        "title, status, priority, created_at, leases(units(label, properties(name)))",
      )
      .in("lease_id", leaseIds)
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString())
      .order("created_at", { ascending: false });

    for (const r of repairs ?? []) {
      type U = { label: string; properties: { name: string } | { name: string }[] };
      type L = { units: U | U[] | null };
      const leaseRaw = r.leases as L | L[] | null;
      const lease = Array.isArray(leaseRaw) ? leaseRaw[0] : leaseRaw;
      const unitRaw = lease?.units;
      const unit = Array.isArray(unitRaw) ? unitRaw[0] : unitRaw;
      const pRaw = unit?.properties;
      const property = Array.isArray(pRaw) ? pRaw[0] : pRaw;

      maintenance.push({
        propertyName: property?.name ?? "—",
        unitLabel: unit?.label ?? "—",
        title: r.title,
        status: r.status,
        priority: r.priority,
        createdAt: r.created_at,
      });
    }
  }

  const occupied = units.filter((u) => u.occupied).length;

  return {
    periodLabel: monthLabel(year, month),
    generatedAt: new Date().toISOString(),
    managerName: profile?.full_name?.trim() || "Property manager",
    units,
    maintenance,
    totals: {
      unitCount: units.length,
      occupied,
      vacant: units.length - occupied,
      expectedRentCents,
      collectedCents,
      outstandingCents,
      paidCount,
      openCount,
      lateCount,
      maintenanceOpen: maintenance.filter(
        (m) => m.status !== "completed" && m.status !== "cancelled",
      ).length,
    },
  };
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  row.alignment = { vertical: "middle" };
  row.height = 22;
}

function styleKpiCell(cell: ExcelJS.Cell, fill: string) {
  cell.font = { bold: true, size: 14, color: { argb: NAVY } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top: { style: "thin", color: { argb: BLUE } },
    left: { style: "thin", color: { argb: BLUE } },
    bottom: { style: "thin", color: { argb: BLUE } },
    right: { style: "thin", color: { argb: BLUE } },
  };
}

export async function buildMonthlySummaryWorkbook(data: MonthlySummaryData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
  });
  summary.mergeCells("A1:F1");
  summary.getCell("A1").value = `${BRAND.name} — Monthly Owner Report`;
  summary.getCell("A1").font = { size: 18, bold: true, color: { argb: NAVY } };

  summary.mergeCells("A2:F2");
  summary.getCell("A2").value = data.periodLabel;
  summary.getCell("A2").font = { size: 12, color: { argb: BLUE } };

  summary.getCell("A4").value = "Prepared by";
  summary.getCell("B4").value = data.managerName;
  summary.getCell("A5").value = "Generated";
  summary.getCell("B5").value = new Date(data.generatedAt).toLocaleString();

  const kpis = [
    ["Units", data.totals.unitCount],
    ["Occupied", data.totals.occupied],
    ["Rent collected", formatMoney(data.totals.collectedCents)],
    ["Outstanding", formatMoney(data.totals.outstandingCents)],
    ["Paid invoices", data.totals.paidCount],
    ["Open maintenance", data.totals.maintenanceOpen],
  ];

  let kpiRow = 7;
  for (let i = 0; i < kpis.length; i += 2) {
    const left = kpis[i];
    const right = kpis[i + 1];
    summary.mergeCells(`A${kpiRow}:B${kpiRow}`);
    summary.getCell(`A${kpiRow}`).value = left[0];
    summary.getCell(`C${kpiRow}`).value = left[1];
    styleKpiCell(summary.getCell(`A${kpiRow}`), LIGHT);
    styleKpiCell(summary.getCell(`C${kpiRow}`), MUTED);
    if (right) {
      summary.mergeCells(`D${kpiRow}:E${kpiRow}`);
      summary.getCell(`D${kpiRow}`).value = right[0];
      summary.getCell(`F${kpiRow}`).value = right[1];
      styleKpiCell(summary.getCell(`D${kpiRow}`), LIGHT);
      styleKpiCell(summary.getCell(`F${kpiRow}`), MUTED);
    }
    kpiRow += 2;
  }

  const chartRow = kpiRow + 1;
  summary.getCell(`A${chartRow}`).value = "Collection overview";
  summary.getCell(`A${chartRow}`).font = { bold: true, color: { argb: NAVY } };

  const chartHeader = chartRow + 1;
  summary.getRow(chartHeader).values = ["Status", "Count", "Amount"];
  styleHeader(summary.getRow(chartHeader));

  const chartData = [
    ["Paid", data.totals.paidCount, formatMoney(data.totals.collectedCents)],
    ["Open", data.totals.openCount, ""],
    ["Late", data.totals.lateCount, ""],
    ["Vacant units", data.totals.vacant, ""],
  ];
  chartData.forEach((row, idx) => {
    const r = summary.getRow(chartHeader + 1 + idx);
    r.values = row;
    if (idx % 2 === 0) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MUTED } };
    }
  });

  summary.getCell(`A${chartHeader + chartData.length + 2}`).value =
    "Tip: Select the table above in Excel and insert a chart (Insert → Chart) for visuals.";
  summary.getCell(`A${chartHeader + chartData.length + 2}`).font = {
    italic: true,
    color: { argb: "FF64748B" },
  };

  summary.columns = [
    { width: 18 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 18 },
  ];

  const unitsSheet = workbook.addWorksheet("Units");
  unitsSheet.columns = [
    { header: "Property", key: "property", width: 22 },
    { header: "Unit", key: "unit", width: 12 },
    { header: "Tenant", key: "tenant", width: 20 },
    { header: "Email", key: "email", width: 28 },
    { header: "Rent", key: "rent", width: 12 },
    { header: "Invoice status", key: "status", width: 14 },
    { header: "Invoice amount", key: "amount", width: 14 },
    { header: "Late fee", key: "late", width: 12 },
    { header: "Paid at", key: "paid", width: 20 },
  ];
  styleHeader(unitsSheet.getRow(1));
  unitsSheet.autoFilter = { from: "A1", to: "I1" };

  data.units.forEach((u, idx) => {
    const row = unitsSheet.addRow({
      property: u.propertyName,
      unit: u.unitLabel,
      tenant: u.occupied ? u.tenantName : "Vacant",
      email: u.occupied ? u.tenantEmail : "—",
      rent: formatMoney(u.rentCents),
      status: u.invoiceStatus,
      amount: u.invoiceAmountCents ? formatMoney(u.invoiceAmountCents) : "—",
      late: u.lateFeeCents ? formatMoney(u.lateFeeCents) : "—",
      paid: u.paidAt ? new Date(u.paidAt).toLocaleString() : "—",
    });
    if (!u.occupied) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
    } else if (u.invoiceStatus === "paid") {
      row.getCell("status").font = { color: { argb: GREEN }, bold: true };
    } else if (u.invoiceStatus === "late") {
      row.getCell("status").font = { color: { argb: "FFDC2626" }, bold: true };
    }
    if (idx % 2 === 1 && u.occupied) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MUTED } };
    }
  });

  const maintSheet = workbook.addWorksheet("Maintenance");
  maintSheet.columns = [
    { header: "Property", key: "property", width: 22 },
    { header: "Unit", key: "unit", width: 12 },
    { header: "Issue", key: "title", width: 30 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Submitted", key: "created", width: 22 },
  ];
  styleHeader(maintSheet.getRow(1));
  maintSheet.autoFilter = { from: "A1", to: "F1" };

  if (data.maintenance.length === 0) {
    maintSheet.addRow({ property: "—", unit: "—", title: "No maintenance requests this month", priority: "", status: "", created: "" });
  } else {
    data.maintenance.forEach((m, idx) => {
      const row = maintSheet.addRow({
        property: m.propertyName,
        unit: m.unitLabel,
        title: m.title,
        priority: m.priority,
        status: m.status,
        created: new Date(m.createdAt).toLocaleString(),
      });
      if (idx % 2 === 0) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MUTED } };
      }
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function monthlySummaryFilename(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  return `got-my-rent-summary-${year}-${mm}.xlsx`;
}
