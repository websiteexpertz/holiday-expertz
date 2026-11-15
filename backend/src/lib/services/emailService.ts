import nodemailer from "nodemailer";
import { ContactInquiryRecord } from "../../types/admin";

export interface SendInquiryResult {
  attempted: boolean;
  delivered: boolean;
  recipient: string;
  messageId?: string;
  error?: string;
  note?: string;
}

/**
 * Dispatches an email notification to the designated contact email (contact@holidayexpertz.com)
 * when a visitor submits a contact or inquiry form.
 */
export async function sendInquiryNotificationEmail(
  inquiry: ContactInquiryRecord
): Promise<SendInquiryResult> {
  const recipient =
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    "contact@holidayexpertz.com";

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  const fromAddress =
    process.env.SMTP_FROM ||
    `"Holiday Expertz Inquiries" <${smtpUser || "contact@holidayexpertz.com"}>`;

  const emailSubject = `[Holiday Expertz Inquiry] ${inquiry.subject || "New Contact Submission"} - ${inquiry.name}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #071f1d 0%, #006F66 100%); padding: 24px 32px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Holiday Expertz</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #9fb8b5;">New Website Contact Form Submission</p>
      </div>

      <div style="padding: 32px; color: #334155; line-height: 1.6;">
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #f0fdfa; border: 1px solid #ccfbf1; color: #0d9488; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 9999px;">
            Inquiry ID: ${inquiry.id}
          </span>
          <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">
            ${new Date(inquiry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 130px; font-weight: 600;">Full Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${inquiry.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email Address:</td>
            <td style="padding: 8px 0; color: #006F66; font-weight: 600;">
              <a href="mailto:${inquiry.email}" style="color: #006F66; text-decoration: none;">${inquiry.email}</a>
            </td>
          </tr>
          ${
            inquiry.phone
              ? `<tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone Number:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${inquiry.phone}</td>
                </tr>`
              : ""
          }
          ${
            inquiry.relatedPropertyName
              ? `<tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Property:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${inquiry.relatedPropertyName}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Subject:</td>
            <td style="padding: 8px 0; color: #0f172a;">${inquiry.subject}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Message Content</div>
          <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${inquiry.message}</div>
        </div>

        <div style="text-align: center; margin-top: 28px;">
          <a href="mailto:${inquiry.email}?subject=${encodeURIComponent("Re: " + inquiry.subject)}" style="display: inline-block; padding: 12px 28px; background-color: #006F66; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.3px;">
            Reply to ${inquiry.name}
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center;">
        This automated notification was dispatched to <strong>${recipient}</strong> via Holiday Expertz Contact Gateway.
      </div>
    </div>
  `;

  const textContent = `
NEW INQUIRY RECEIVED - HOLIDAY EXPERTZ
--------------------------------------
Inquiry ID: ${inquiry.id}
Date: ${new Date(inquiry.createdAt).toISOString()}

Name: ${inquiry.name}
Email: ${inquiry.email}
Phone: ${inquiry.phone || "Not provided"}
${inquiry.relatedPropertyName ? `Property: ${inquiry.relatedPropertyName}\n` : ""}Subject: ${inquiry.subject}

Message:
${inquiry.message}
--------------------------------------
Reply directly to: ${inquiry.email}
Dispatched to: ${recipient}
  `.trim();

  // If SMTP is not configured, record and log gracefully without failing
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(
      `[EMAIL SERVICE NOTICE] SMTP credentials not fully configured in environment.\n` +
      `Target Recipient: ${recipient}\n` +
      `Inquiry ID: ${inquiry.id}\n` +
      `From: ${inquiry.name} <${inquiry.email}>\n` +
      `The inquiry has been safely persisted to the database and is visible in the Admin Portal (/admin/inquiries).`
    );

    return {
      attempted: false,
      delivered: false,
      recipient,
      note: "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in environment. Inquiry recorded in database and admin dashboard.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      replyTo: inquiry.email,
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCH SUCCESS] Delivered to ${recipient} (Message ID: ${info.messageId})`);

    return {
      attempted: true,
      delivered: true,
      recipient,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[EMAIL DISPATCH ERROR] Failed to deliver to ${recipient}:`, error);

    return {
      attempted: true,
      delivered: false,
      recipient,
      error: error?.message || "Unknown SMTP delivery error",
    };
  }
}

