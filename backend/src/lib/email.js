/**
 * Email service for PSPBA application notifications.
 * Uses Nodemailer with SMTP. When SMTP is not configured, emails are skipped (no-op).
 *
 * Env vars: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, STAFF_NOTIFICATION_EMAIL
 */

import nodemailer from 'nodemailer';

const hasSmtp = () =>
  process.env.SMTP_HOST &&
  process.env.SMTP_FROM;

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!hasSmtp()) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

/**
 * Send an email. Returns true if sent, false if skipped (no SMTP configured).
 * Does not throw; logs errors.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.text]
 * @param {string} [opts.html]
 * @param {Array}  [opts.attachments] - Nodemailer attachment objects
 */
export async function sendMail({ to, subject, text, html, attachments }) {
  const trans = getTransporter();
  if (!trans) return false;
  try {
    await trans.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
      html: html || undefined,
      attachments: attachments || undefined,
    });
    return true;
  } catch (err) {
    console.error('[email] send failed:', err.message);
    return false;
  }
}

/**
 * Send confirmation email to an applicant after submission.
 */
export async function sendApplicationConfirmation({ to, name, type, applicationId }) {
  const typeLabel = { volunteer: 'Volunteer', intern: 'Intern', consultant: 'Consultant' }[type] || type;
  const subject = `PSPBA — Your ${typeLabel} application has been received`;
  const idNote = applicationId ? `\n\nYour application ID is ${applicationId}. You can check your status at our website using this ID and your email.\n` : '';
  const text = `Dear ${name},\n\nThank you for submitting your ${typeLabel.toLowerCase()} application to the Plateau State Peacebuilding Agency (PSPBA). We have received your application and will review it.${idNote}\nYou will be contacted if your application is shortlisted.\n\nBest regards,\nPSPBA Team`;
  const idHtml = applicationId ? `<p>Your application ID is <strong>${applicationId}</strong>. You can check your status on our website using this ID and your email.</p>` : '';
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:1rem;"><p>Dear ${name},</p><p>Thank you for submitting your ${typeLabel.toLowerCase()} application to the Plateau State Peacebuilding Agency (PSPBA). We have received your application and will review it.</p>${idHtml}<p>You will be contacted if your application is shortlisted.</p><p>Best regards,<br/>PSPBA Team</p></body></html>`;
  return sendMail({ to, subject, text, html });
}

/**
 * Send a requested document to a requester as an email attachment.
 */
export async function sendDocumentToRequester({ to, requesterName, documentTitle, filePath, fileName }) {
  const subject = `PSPBA — Requested Document: ${documentTitle}`;
  const text = `Dear ${requesterName},\n\nYour request for the document "${documentTitle}" has been approved. Please find the document attached to this email.\n\nBest regards,\nPSPBA Team`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:1rem;">
    <p>Dear ${requesterName},</p>
    <p>Your request for the document <strong>"${documentTitle}"</strong> has been approved. Please find the document attached to this email.</p>
    <p>Best regards,<br/>PSPBA Team</p>
  </body></html>`;
  return sendMail({
    to,
    subject,
    text,
    html,
    attachments: [{ filename: fileName || documentTitle, path: filePath }],
  });
}

/**
 * Notify PSPBA staff of a new application.
 */
export async function notifyStaffNewApplication({ applicantName, applicantEmail, type, applicationId }) {
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL;
  if (!staffEmail) return false;
  const typeLabel = { volunteer: 'Volunteer', intern: 'Intern', consultant: 'Consultant' }[type] || type;
  const subject = `PSPBA — New ${typeLabel} application: ${applicantName}`;
  const text = `A new ${typeLabel.toLowerCase()} application has been submitted.\n\nApplicant: ${applicantName}\nEmail: ${applicantEmail}\nType: ${typeLabel}\nApplication ID: ${applicationId}\n\nPlease log in to the admin portal to review.`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:1rem;"><h2>New ${typeLabel} application</h2><p><strong>Applicant:</strong> ${applicantName}<br/><strong>Email:</strong> ${applicantEmail}<br/><strong>Type:</strong> ${typeLabel}<br/><strong>Application ID:</strong> ${applicationId}</p><p>Please log in to the admin portal to review.</p></body></html>`;
  return sendMail({ to: staffEmail, subject, text, html });
}
