import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail, sendSms } from "./outbound";
import type { ReminderTemplate } from "./templates";

type SendReminderInput = {
  template: ReminderTemplate;
  profileId: string;
  leaseId: string;
  invoiceId: string;
  email: string | null;
  phone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  subject: string;
  body: string;
  smsBody: string;
};

async function alreadySentToday(invoiceId: string, template: string, channel: "email" | "sms") {
  const supabase = createServiceClient();
  if (!supabase) return true;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("notification_log")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("template", template)
    .eq("channel", channel)
    .gte("sent_at", start.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function logNotification(row: {
  profileId: string;
  leaseId: string;
  invoiceId: string;
  channel: "email" | "sms";
  template: string;
  body: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase.from("notification_log").insert({
    profile_id: row.profileId,
    lease_id: row.leaseId,
    invoice_id: row.invoiceId,
    channel: row.channel,
    template: row.template,
    body: row.body,
  });
}

export async function sendRentReminder(input: SendReminderInput) {
  const results: { channel: string; ok: boolean; error?: string }[] = [];

  if (input.notifyEmail && input.email) {
    if (!(await alreadySentToday(input.invoiceId, input.template, "email"))) {
      const result = await sendEmail(input.email, input.subject, input.body);
      if (result.ok) {
        await logNotification({
          profileId: input.profileId,
          leaseId: input.leaseId,
          invoiceId: input.invoiceId,
          channel: "email",
          template: input.template,
          body: input.body,
        });
      }
      results.push({ channel: "email", ...result });
    }
  }

  if (input.notifySms && input.phone) {
    if (!(await alreadySentToday(input.invoiceId, input.template, "sms"))) {
      const result = await sendSms(input.phone, input.smsBody);
      if (result.ok) {
        await logNotification({
          profileId: input.profileId,
          leaseId: input.leaseId,
          invoiceId: input.invoiceId,
          channel: "sms",
          template: input.template,
          body: input.smsBody,
        });
      }
      results.push({ channel: "sms", ...result });
    }
  }

  return results;
}
