import nodemailer from "nodemailer";
import { ContactInquiryRecord, InquiryNotificationRecord } from "../../types/admin";

export interface SendInquiryResult {
  attempted: boolean;
  delivered: boolean;
  recipient: string;
  messageId?: string;
  error?: string;
  note?: string;
}

export interface DualPropertyInquiryDispatchResult {
  adminResult: SendInquiryResult;
  ownerResult: SendInquiryResult;
  notifications: InquiryNotificationRecord[];
}

function getSmtpConfig() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  const fromAddress =
    process.env.SMTP_FROM ||
    `"Holiday Expertz Inquiries" <${smtpUser || "contact@holidayexpertz.com"}>`;

  const isConfigured = Boolean(smtpHost && smtpUser && smtpPass);

  return {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpSecure,
    fromAddress,
    isConfigured,
  };
}

/**
 * Dispatches a general website contact inquiry email to the designated contact email (contact@holidayexpertz.com)
 */
export async function sendInquiryNotificationEmail(
  inquiry: ContactInquiryRecord
): Promise<SendInquiryResult> {
  const recipient =
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    "contact@holidayexpertz.com";

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, fromAddress, isConfigured } =
    getSmtpConfig();

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

  if (!isConfigured) {
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
      note: "SMTP credentials not configured in environment. Inquiry recorded in database and admin dashboard.",
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

/**
 * EMAIL 1: HOLIDAY EXPERTZ ADMIN NOTIFICATION
 * Dispatches property inquiry email to the configured admin recipient.
 */
export async function sendAdminPropertyInquiryEmail(
  inquiry: ContactInquiryRecord
): Promise<SendInquiryResult> {
  const recipient =
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    "contact@holidayexpertz.com";

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, fromAddress, isConfigured } =
    getSmtpConfig();

  const propIdentifier = inquiry.propertyNumber || inquiry.relatedPropertyId || "";
  const emailSubject = propIdentifier
    ? `New Property Inquiry — ${inquiry.relatedPropertyName || "Property"} — ${propIdentifier}`
    : `New Property Inquiry — ${inquiry.relatedPropertyName || "Property"}`;

  const textContent = `
NEW PROPERTY INQUIRY
Holiday Expertz

PROPERTY INFORMATION
--------------------------------
Property Name: ${inquiry.relatedPropertyName || "N/A"}
Property Number: ${inquiry.propertyNumber || "N/A"}
Owner Number: ${inquiry.ownerNumber || "N/A"}
Property Location: ${inquiry.propertyLocation || "N/A"}
Property Page: ${inquiry.propertyUrl || "N/A"}

GUEST INFORMATION
--------------------------------
Full Name: ${inquiry.name}
Email Address: ${inquiry.email}
Mobile / WhatsApp: ${inquiry.phone || "Not Provided"}

TRAVEL DETAILS
--------------------------------
Check-in: ${inquiry.checkInDate || "N/A"}
Check-out: ${inquiry.checkOutDate || "N/A"}
Number of Guests: ${inquiry.guestCount || "N/A"}

GUEST MESSAGE
--------------------------------
${inquiry.message || "No Additional Message"}

INQUIRY DETAILS
--------------------------------
Inquiry Reference: ${inquiry.id}
Submitted At: ${new Date(inquiry.createdAt).toISOString()}

This is a property inquiry only.
No reservation has been confirmed.
  `.trim();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #071f1d 0%, #006F66 100%); padding: 26px 32px; color: #ffffff;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a7f3d0; background-color: rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;">
          Admin Notification • Property Inquiry
        </span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Holiday Expertz</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">A new inquiry has been received for <strong>${inquiry.relatedPropertyName || "Listed Property"}</strong></p>
      </div>

      <div style="padding: 28px 32px; color: #334155; line-height: 1.6;">
        <div style="margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #f0fdfa; border: 1px solid #ccfbf1; color: #0d9488; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 9999px;">
            Inquiry Ref: ${inquiry.id}
          </span>
          <span style="font-size: 12px; color: #94a3b8;">
            ${new Date(inquiry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        <!-- Property Information -->
        <div style="margin-bottom: 22px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #006F66; text-transform: uppercase; letter-spacing: 0.5px;">
            Property Information
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px; font-weight: 600;">Property Name:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.relatedPropertyName || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Property Number:</td>
              <td style="padding: 4px 0; color: #0f172a; font-family: monospace; font-weight: 700;">${inquiry.propertyNumber || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Owner Number:</td>
              <td style="padding: 4px 0; color: #006F66; font-family: monospace; font-weight: 700;">${inquiry.ownerNumber || "N/A"}</td>
            </tr>
            ${inquiry.propertyLocation ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Location:</td>
              <td style="padding: 4px 0; color: #0f172a;">${inquiry.propertyLocation}</td>
            </tr>` : ""}
            ${inquiry.propertyUrl ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Property Page:</td>
              <td style="padding: 4px 0;">
                <a href="${inquiry.propertyUrl}" style="color: #006F66; text-decoration: underline; font-weight: 600;" target="_blank">
                  View Property Listing &rarr;
                </a>
              </td>
            </tr>` : ""}
          </table>
        </div>

        <!-- Guest Information -->
        <div style="margin-bottom: 22px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #006F66; text-transform: uppercase; letter-spacing: 0.5px;">
            Guest Information
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px; font-weight: 600;">Full Name:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Email Address:</td>
              <td style="padding: 4px 0; color: #006F66; font-weight: 600;">
                <a href="mailto:${inquiry.email}" style="color: #006F66; text-decoration: none;">${inquiry.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Mobile / WhatsApp:</td>
              <td style="padding: 4px 0; color: #0f172a;">${inquiry.phone || "Not Provided"}</td>
            </tr>
          </table>
        </div>

        <!-- Travel Details -->
        <div style="margin-bottom: 22px; background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 18px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
            Travel Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #115e59; width: 140px; font-weight: 600;">Check-in:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.checkInDate || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #115e59; font-weight: 600;">Check-out:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.checkOutDate || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #115e59; font-weight: 600;">Number of Guests:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.guestCount || "N/A"} Guest${(inquiry.guestCount || 1) > 1 ? "s" : ""}</td>
            </tr>
          </table>
        </div>

        <!-- Guest Message -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
            Guest Message
          </h3>
          <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${inquiry.message || "No Additional Message"}</div>
        </div>

        <!-- Reply Button -->
        <div style="text-align: center; margin-top: 26px;">
          <a href="mailto:${inquiry.email}?subject=${encodeURIComponent("Re: " + emailSubject)}" style="display: inline-block; padding: 12px 28px; background-color: #006F66; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(0, 111, 102, 0.2);">
            Reply Directly to Guest (${inquiry.email})
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        <strong>Notice:</strong> This is a property inquiry only. No reservation has been confirmed.<br />
        Dispatched to <strong>${recipient}</strong> via Holiday Expertz Contact Gateway.
      </div>
    </div>
  `;

  if (!isConfigured) {
    console.log(
      `[EMAIL SERVICE NOTICE] SMTP credentials not fully configured in environment.\n` +
      `Admin Target Recipient: ${recipient}\n` +
      `Inquiry Reference: ${inquiry.id}\n` +
      `Property: ${inquiry.relatedPropertyName} (${inquiry.propertyNumber || "N/A"})\n` +
      `Owner Number: ${inquiry.ownerNumber || "N/A"}\n` +
      `Guest: ${inquiry.name} <${inquiry.email}>\n` +
      `Inquiry safely stored in database.`
    );

    return {
      attempted: false,
      delivered: false,
      recipient,
      note: "SMTP credentials not configured in environment. Inquiry recorded in database and admin dashboard.",
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

    return {
      attempted: true,
      delivered: true,
      recipient,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[ADMIN EMAIL DISPATCH ERROR] Failed to deliver to ${recipient}:`, error);
    return {
      attempted: true,
      delivered: false,
      recipient,
      error: error?.message || "Unknown SMTP delivery error",
    };
  }
}

/**
 * EMAIL 2: ASSIGNED PROPERTY OWNER NOTIFICATION
 * Dispatches property inquiry email directly to the property's assigned owner email.
 */
export async function sendOwnerPropertyInquiryEmail(
  inquiry: ContactInquiryRecord,
  owner: { email: string; fullName: string; ownerNumber?: string }
): Promise<SendInquiryResult> {
  const recipient = owner.email?.trim().toLowerCase();

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return {
      attempted: false,
      delivered: false,
      recipient: recipient || "Unassigned",
      error: "Assigned owner does not have a valid registered email address.",
    };
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, fromAddress, isConfigured } =
    getSmtpConfig();

  // Required Subject Format:
  // New Guest Inquiry for Your Property — [Property Name]
  const emailSubject = `New Guest Inquiry for Your Property — ${inquiry.relatedPropertyName || "Your Property"}`;

  const textContent = `
NEW GUEST INQUIRY
Holiday Expertz

Hello ${owner.fullName || "Property Host"},

You have received a new inquiry for your property.

PROPERTY DETAILS
--------------------------------
Property Name: ${inquiry.relatedPropertyName || "N/A"}
Property Number: ${inquiry.propertyNumber || "N/A"}

GUEST DETAILS
--------------------------------
Full Name: ${inquiry.name}
Email: ${inquiry.email}
Mobile / WhatsApp: ${inquiry.phone || "Not Provided"}

TRAVEL DETAILS
--------------------------------
Check-in: ${inquiry.checkInDate || "N/A"}
Check-out: ${inquiry.checkOutDate || "N/A"}
Number of Guests: ${inquiry.guestCount || "N/A"}

MESSAGE
--------------------------------
${inquiry.message || "No Additional Message"}

Inquiry Reference: ${inquiry.id}

Please review the guest's inquiry and respond
through the available communication channel.

This is an inquiry only and does not confirm
a booking.

Regards,
Holiday Expertz
  `.trim();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #071f1d 0%, #006F66 100%); padding: 26px 32px; color: #ffffff;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a7f3d0; background-color: rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;">
          Host Notification • New Guest Inquiry
        </span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Holiday Expertz</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">A traveler is interested in staying at <strong>${inquiry.relatedPropertyName || "your property"}</strong></p>
      </div>

      <div style="padding: 28px 32px; color: #334155; line-height: 1.6;">
        <div style="margin-bottom: 20px;">
          <p style="font-size: 15px; color: #0f172a; margin: 0 0 6px 0;">Hello <strong>${owner.fullName || "Property Host"}</strong>,</p>
          <p style="font-size: 13px; color: #475569; margin: 0;">You have received a new guest inquiry for your property.</p>
        </div>

        <div style="margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #f0fdfa; border: 1px solid #ccfbf1; color: #0d9488; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 9999px;">
            Inquiry Ref: ${inquiry.id}
          </span>
          <span style="font-size: 12px; color: #94a3b8;">
            ${new Date(inquiry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        <!-- Property Details -->
        <div style="margin-bottom: 22px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #006F66; text-transform: uppercase; letter-spacing: 0.5px;">
            Property Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px; font-weight: 600;">Property Name:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.relatedPropertyName || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Property Number:</td>
              <td style="padding: 4px 0; color: #0f172a; font-family: monospace; font-weight: 700;">${inquiry.propertyNumber || "N/A"}</td>
            </tr>
          </table>
        </div>

        <!-- Guest Details -->
        <div style="margin-bottom: 22px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #006F66; text-transform: uppercase; letter-spacing: 0.5px;">
            Guest Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px; font-weight: 600;">Full Name:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Email:</td>
              <td style="padding: 4px 0; color: #006F66; font-weight: 600;">
                <a href="mailto:${inquiry.email}" style="color: #006F66; text-decoration: none;">${inquiry.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Mobile / WhatsApp:</td>
              <td style="padding: 4px 0; color: #0f172a;">${inquiry.phone || "Not Provided"}</td>
            </tr>
          </table>
        </div>

        <!-- Travel Details -->
        <div style="margin-bottom: 22px; background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 18px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
            Travel Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #115e59; width: 140px; font-weight: 600;">Check-in:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.checkInDate || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #115e59; font-weight: 600;">Check-out:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.checkOutDate || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #115e59; font-weight: 600;">Number of Guests:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inquiry.guestCount || "N/A"} Guest${(inquiry.guestCount || 1) > 1 ? "s" : ""}</td>
            </tr>
          </table>
        </div>

        <!-- Message -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
            Message
          </h3>
          <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${inquiry.message || "No Additional Message"}</div>
        </div>

        <div style="text-align: center; margin-top: 26px;">
          <a href="mailto:${inquiry.email}?subject=${encodeURIComponent("Re: " + emailSubject)}" style="display: inline-block; padding: 12px 28px; background-color: #006F66; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(0, 111, 102, 0.2);">
            Reply Directly to Guest (${inquiry.email})
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
          Please review the guest&apos;s inquiry and respond through the available communication channel.<br />
          This is an inquiry only and does not confirm a booking.
        </p>

        <p style="font-size: 13px; color: #0f172a; font-weight: 600; margin: 20px 0 0 0; text-align: center;">
          Regards,<br />
          Holiday Expertz
        </p>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        This notification was delivered to the registered property host at <strong>${recipient}</strong>.
      </div>
    </div>
  `;

  if (!isConfigured) {
    console.log(
      `[EMAIL SERVICE NOTICE] SMTP credentials not fully configured in environment.\n` +
      `Owner Target Recipient: ${recipient}\n` +
      `Inquiry Reference: ${inquiry.id}\n` +
      `Property: ${inquiry.relatedPropertyName} (${inquiry.propertyNumber || "N/A"})\n` +
      `Guest: ${inquiry.name} <${inquiry.email}>\n` +
      `Inquiry safely stored in database.`
    );

    return {
      attempted: false,
      delivered: false,
      recipient,
      note: "SMTP credentials not configured in environment. Inquiry recorded in database and dashboard.",
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

    return {
      attempted: true,
      delivered: true,
      recipient,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[OWNER EMAIL DISPATCH ERROR] Failed to deliver to ${recipient}:`, error);
    return {
      attempted: true,
      delivered: false,
      recipient,
      error: error?.message || "Unknown SMTP delivery error",
    };
  }
}

/**
 * DUAL EMAIL DISPATCHER FOR PROPERTY INQUIRIES
 * Sends TWO separate emails independently:
 * 1. Holiday Expertz Admin Email
 * 2. Assigned Property Owner Email
 * Tracks delivery records independently and prevents cross-exposure (no shared To/CC).
 */
export async function sendDualPropertyInquiryEmails(
  inquiry: ContactInquiryRecord,
  owner?: { email?: string; fullName?: string; ownerNumber?: string }
): Promise<DualPropertyInquiryDispatchResult> {
  const adminRecipient =
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    "contact@holidayexpertz.com";

  const ownerRecipient = (owner?.email || "").trim().toLowerCase();
  const now = new Date().toISOString();

  // Create two separate notification tracking records
  const adminNotification: InquiryNotificationRecord = {
    id: `${inquiry.id}_admin`,
    inquiryId: inquiry.id,
    recipientType: "PROPERTY_INQUIRY_ADMIN",
    recipientEmail: adminRecipient,
    recipientName: "Holiday Expertz Concierge",
    status: "pending",
    attemptCount: 1,
    lastAttempt: now,
  };

  const ownerNotification: InquiryNotificationRecord = {
    id: `${inquiry.id}_owner`,
    inquiryId: inquiry.id,
    recipientType: "PROPERTY_INQUIRY_OWNER",
    recipientEmail: ownerRecipient || "Unassigned",
    recipientName: owner?.fullName || "Property Host",
    status: "pending",
    attemptCount: 1,
    lastAttempt: now,
  };

  // 1. Dispatch Email 1 to Admin
  const adminResult = await sendAdminPropertyInquiryEmail(inquiry);
  if (adminResult.delivered) {
    adminNotification.status = "sent";
    adminNotification.sentAt = new Date().toISOString();
    adminNotification.messageId = adminResult.messageId;
  } else {
    adminNotification.status = "failed";
    adminNotification.lastError = adminResult.error || adminResult.note || "Delivery not confirmed";
  }

  // 2. Dispatch Email 2 to Owner (as completely separate message)
  let ownerResult: SendInquiryResult;
  if (!ownerRecipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerRecipient)) {
    ownerResult = {
      attempted: false,
      delivered: false,
      recipient: ownerRecipient || "Unassigned",
      error: "Assigned owner does not have a valid registered email address.",
      note: "Requires attention: owner email missing from database record.",
    };
    ownerNotification.status = "failed";
    ownerNotification.lastError = ownerResult.error;
    ownerNotification.note = ownerResult.note;
  } else {
    ownerResult = await sendOwnerPropertyInquiryEmail(inquiry, {
      email: ownerRecipient,
      fullName: owner?.fullName || "Property Host",
      ownerNumber: owner?.ownerNumber,
    });

    if (ownerResult.delivered) {
      ownerNotification.status = "sent";
      ownerNotification.sentAt = new Date().toISOString();
      ownerNotification.messageId = ownerResult.messageId;
    } else {
      ownerNotification.status = "failed";
      ownerNotification.lastError = ownerResult.error || ownerResult.note || "Delivery not confirmed";
      ownerNotification.note = ownerResult.note;
    }
  }

  return {
    adminResult,
    ownerResult,
    notifications: [adminNotification, ownerNotification],
  };
}

// Backward compatible alias
export const sendPropertyInquiryNotificationEmail = sendAdminPropertyInquiryEmail;


