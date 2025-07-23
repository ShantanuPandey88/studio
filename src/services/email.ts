
'use server';
/**
 * @fileOverview Email service for sending application emails.
 *
 * This service uses nodemailer to send emails via a third-party SMTP provider
 * (e.g., SendGrid, Mailgun, Brevo) or a direct SMTP server.
 *
 * It is NOT connected to Firebase services. It is a standalone email sender.
 *
 * It requires SMTP credentials to be configured as environment variables.
 * Without these, no emails will be sent.
 */
import nodemailer from 'nodemailer';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

// Check for the presence of required environment variables.
// This provides a clear warning in the server logs if the email service is not configured.
if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.warn(`
    ****************************************************************
    * WARNING: Email service is not configured.                    *
    * Password reset and other application emails will not be sent.  *
    * Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS  *
    * in your environment variables.                                 *
    ****************************************************************
  `);
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: Number(EMAIL_PORT) === 465, // true for 465 (SMTPS), false for other ports (like 587 with STARTTLS)
  auth: {
    user: EMAIL_USER, // Your SMTP username
    pass: EMAIL_PASS, // Your SMTP password or API key
  },
});

export type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends an email using the configured transporter.
 * This function will throw an error if the email service is not configured.
 * @param options - The email options (to, subject, text, html).
 * @returns A promise that resolves when the email is sent successfully.
 */
export async function sendEmail(options: EmailOptions) {
  // Hard check before attempting to send.
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.error("Attempted to send email, but the service is not configured on the server.");
    // This error will be caught by the calling server action and can be relayed to the client.
    throw new Error("Email service is not configured on the server. Please contact an administrator.");
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM || `"SeatServe" <no-reply@example.com>`,
      ...options,
    });
    console.log('Message sent successfully: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email via nodemailer:', error);
    // Propagate a generic error to avoid leaking implementation details.
    throw new Error("Failed to send email due to a server error.");
  }
}
