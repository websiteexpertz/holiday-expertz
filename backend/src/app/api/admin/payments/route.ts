import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllPayments, updatePaymentStatus } from "../../../../lib/storage/paymentStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase().trim();

    let payments = getAllPayments();

    if (type && type !== "all") {
      payments = payments.filter((p) => p.type === type);
    }

    if (status && status !== "all") {
      payments = payments.filter((p) => p.status === status);
    }

    if (search) {
      payments = payments.filter(
        (p) =>
          p.transactionReference.toLowerCase().includes(search) ||
          p.payerName.toLowerCase().includes(search) ||
          p.payerEmail.toLowerCase().includes(search) ||
          (p.bookingReference && p.bookingReference.toLowerCase().includes(search))
      );
    }

    const totalRevenue = payments
      .filter((p) => p.status === "successful")
      .reduce((sum, p) => sum + p.amount, 0);

    const subscriptionRevenue = payments
      .filter((p) => p.type === "subscription_fee" && p.status === "successful")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      payments,
      total: payments.length,
      metrics: {
        totalRevenue,
        subscriptionRevenue,
      },
    });
  } catch (error) {
    console.error("Admin Payments GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "payments.refund")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, refundedAmount } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "Payment id and status required" }, { status: 400 });
    }

    const updated = updatePaymentStatus(id, status, refundedAmount);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Payment transaction not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "subscriptions_and_payments",
      action: "update_payment_status",
      resourceId: id,
      resourceType: "payment",
      details: `Updated payment ${updated.transactionReference} status to ${status}`,
      status: "success",
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error("Admin Payments PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update payment" }, { status: 500 });
  }
}
