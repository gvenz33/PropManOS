type EmailAttachment = {
  filename: string;
  content: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachments?: EmailAttachment[],
  html?: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATIONS_FROM_EMAIL;
  if (!apiKey || !from) return { ok: false, error: "Email not configured." };

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    text: body,
  };
  if (html) {
    payload.html = html;
  }
  if (attachments?.length) {
    payload.attachments = attachments;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }
  return { ok: true as const };
}

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return { ok: false, error: "SMS not configured." };

  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: body.slice(0, 1500),
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }
  return { ok: true as const };
}
