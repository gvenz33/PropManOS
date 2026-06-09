import { formatPaymentLines, type UnitPaymentInfo } from "@/lib/payments";
import { formatMoney } from "@/lib/utils";

export type ReminderTemplate = "due_in_3_days" | "due_today" | "late";

type BuildMessageInput = {
  template: ReminderTemplate;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  dueDate: string;
  amountCents: number;
  lateFeeCents: number;
  periodLabel: string;
  unit: UnitPaymentInfo;
};

function subjectFor(template: ReminderTemplate, propertyName: string) {
  if (template === "due_in_3_days") return `Rent due in 3 days — ${propertyName}`;
  if (template === "due_today") return `Rent due today — ${propertyName}`;
  return `Rent is late — ${propertyName}`;
}

export function buildReminderMessage(input: BuildMessageInput) {
  const total = input.amountCents + input.lateFeeCents;
  const amountLabel = formatMoney(total);
  const memo = `${input.propertyName} · Unit ${input.unitLabel} · ${input.periodLabel}`;
  const paymentLines = formatPaymentLines(input.unit, amountLabel, memo);

  const intro =
    input.template === "due_in_3_days"
      ? `Hi ${input.tenantName}, rent of ${amountLabel} is due in 3 days on ${input.dueDate}.`
      : input.template === "due_today"
        ? `Hi ${input.tenantName}, rent of ${amountLabel} is due today (${input.dueDate}).`
        : `Hi ${input.tenantName}, rent of ${amountLabel} for ${input.periodLabel} is late (due ${input.dueDate}).`;

  const body = [
    intro,
    "",
    "Pay your landlord using:",
    ...paymentLines.map((line) => `• ${line}`),
    "",
    "After you pay, your landlord will mark the invoice paid in Got My Rent.",
  ].join("\n");

  return {
    subject: subjectFor(input.template, input.propertyName),
    body,
    sms: `${intro} ${paymentLines.join(" ")}`,
  };
}
