export type OwnerEmailSettings = {
  email_sender_name: string | null;
  email_from_address: string | null;
  email_reply_to: string | null;
  email_signature: string | null;
};

export type EmailSendOptions = {
  from?: string;
  replyTo?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.NOTIFICATIONS_FROM_EMAIL?.trim());
}

export function parseDefaultFromEmail(): { name: string | null; address: string } {
  const raw = process.env.NOTIFICATIONS_FROM_EMAIL?.trim() ?? "";
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), address: match[2].trim() };
  }
  return { name: null, address: raw };
}

export function buildFromAddress(settings?: OwnerEmailSettings | null): string | null {
  if (!process.env.RESEND_API_KEY?.trim()) return null;

  const defaults = parseDefaultFromEmail();
  const address = settings?.email_from_address?.trim() || defaults.address;
  const name = settings?.email_sender_name?.trim() || defaults.name;

  if (!address) return null;
  if (name) return `${name} <${address}>`;
  return address;
}

export function buildReplyTo(settings?: OwnerEmailSettings | null): string | undefined {
  const replyTo = settings?.email_reply_to?.trim();
  return replyTo || undefined;
}

export function emailOptionsFromSettings(settings?: OwnerEmailSettings | null): EmailSendOptions {
  const from = buildFromAddress(settings);
  const replyTo = buildReplyTo(settings);
  return {
    ...(from ? { from } : {}),
    ...(replyTo ? { replyTo } : {}),
  };
}

export function appendSignature(body: string, settings?: OwnerEmailSettings | null) {
  const signature = settings?.email_signature?.trim();
  if (!signature) return body;
  return `${body}\n\n${signature}`;
}

export function appendSignatureHtml(html: string, settings?: OwnerEmailSettings | null) {
  const signature = settings?.email_signature?.trim();
  if (!signature) return html;
  const escaped = signature
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");
  return `${html}<p style="margin:16px 0 0;font-size:12px;color:#64748b;">${escaped}</p>`;
}

export function validateEmailAddress(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_RE.test(trimmed)) {
    return `${label} must be a valid email address.`;
  }
  return null;
}

export function previewFromAddress(settings?: OwnerEmailSettings | null) {
  return buildFromAddress(settings) ?? "Not configured";
}
