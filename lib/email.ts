// ---------------------------------------------------------------------------
// Optional email notifications via Nodemailer.
// If SMTP env vars are configured, contact-form submissions are emailed to the
// site owner. If not configured (or sending fails), submissions are still
// safely stored in messages.json — email is a progressive enhancement.
// ---------------------------------------------------------------------------

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_TO) return null;
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM || SMTP_USER,
    to: SMTP_TO,
  };
}

export async function notifyContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const cfg = getSmtpConfig();
  if (!cfg) return;
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transport.sendMail({
      from: cfg.from,
      to: cfg.to,
      replyTo: input.email,
      subject: `[Portfolio contact] ${input.subject}`,
      text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
    });
  } catch (err) {
    // Never fail the request because email is down.
    console.error("[email] notification failed (message still saved):", err);
  }
}
