import mongoose, { Schema, Model } from "mongoose";
import { ContactInquiryRecord } from "../../types/admin";

const InquirySchema = new Schema<ContactInquiryRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, default: "" },
    relatedPropertyId: { type: String, index: true },
    relatedPropertyName: { type: String },
    propertyNumber: { type: String, index: true },
    propertyLocation: { type: String },
    propertyUrl: { type: String },
    ownerId: { type: String, index: true },
    ownerNumber: { type: String, index: true },
    ownerName: { type: String },
    checkInDate: { type: String },
    checkOutDate: { type: String },
    guestCount: { type: Number },
    type: { type: String, enum: ["contact", "property_inquiry"], default: "contact" },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "archived"],
      default: "new",
      index: true,
    },
    adminNotes: { type: String },
    assignedToAdminId: { type: String },
    notifications: [
      {
        id: { type: String },
        inquiryId: { type: String },
        recipientType: { type: String, enum: ["PROPERTY_INQUIRY_ADMIN", "PROPERTY_INQUIRY_OWNER"] },
        recipientEmail: { type: String },
        recipientName: { type: String },
        status: { type: String, enum: ["pending", "sending", "sent", "failed"] },
        attemptCount: { type: Number, default: 0 },
        lastAttempt: { type: String },
        lastError: { type: String },
        sentAt: { type: String },
        messageId: { type: String },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const InquiryModel: Model<ContactInquiryRecord> =
  mongoose.models.Inquiry || mongoose.model<ContactInquiryRecord>("Inquiry", InquirySchema);
