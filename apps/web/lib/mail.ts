export interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Send an email. This is a placeholder implementation that can be easily
 * replaced with a real email service like SendGrid, Resend, or AWS SES.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // TODO: Replace with actual email service implementation.
  console.log(`Sending email to ${to}:`);
  console.log(`Subject: ${subject}`);
  if (text) console.log(`Text: ${text}`);
  if (html) console.log(`HTML: ${html}`);

  // Simulate async operation.
  await new Promise((resolve) => setTimeout(resolve, 100));
}
