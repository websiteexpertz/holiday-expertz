import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "../../../../../lib/security/adminAuthService";
import { getAllCustomers } from "../../../../../lib/storage/userStore";
import { getAllOwners } from "../../../../../lib/storage/propertyOwnerStore";
import { getAllProperties } from "../../../../../lib/storage/propertyStore";
import { getAllBookings } from "../../../../../lib/storage/bookingStore";
import { getAllPayments } from "../../../../../lib/storage/paymentStore";
import { getAllBlogs } from "../../../../../lib/storage/blogStore";
import { getAllEvents } from "../../../../../lib/storage/eventStore";
import { getAllDealsAsync } from "../../../../../lib/storage/dealStore";
import { getAllInquiries } from "../../../../../lib/storage/inquiryStore";
import { getRecentAuditLogs } from "../../../../../lib/storage/auditLogStore";
import { DashboardMetricOverview } from "../../../../../types/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const customers = getAllCustomers();
    const owners = await getAllOwners();
    const properties = getAllProperties();
    const bookings = getAllBookings();
    const payments = getAllPayments();
    const blogs = getAllBlogs();
    const events = getAllEvents();
    const deals = await getAllDealsAsync();
    const inquiries = getAllInquiries();
    const recentActivity = getRecentAuditLogs(15);

    let publishedProperties = 0;
    let pendingProperties = 0;
    let rejectedProperties = 0;
    let draftProperties = 0;

    for (const p of properties) {
      if (p.status === "approved") publishedProperties++;
      else if (p.status === "pending_approval") pendingProperties++;
      else if (p.status === "rejected") rejectedProperties++;
      else if (p.status === "draft" || p.status === "paused") draftProperties++;
    }

    let confirmedBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    for (const b of bookings) {
      if (b.bookingStatus === "confirmed") confirmedBookings++;
      else if (b.bookingStatus === "completed") completedBookings++;
      else if (b.bookingStatus === "cancelled") cancelledBookings++;
    }

    let activeSubscriptions = 0;
    let totalRevenue = 0;

    for (const pay of payments) {
      if (pay.status === "successful") {
        totalRevenue += pay.amount;
        if (pay.type === "subscription_fee") {
          activeSubscriptions++;
        }
      }
    }

    const activeDealsCount = deals.filter((d) => d.status === "active").length;

    const stats: DashboardMetricOverview = {
      totalCustomers: customers.length,
      totalPropertyOwners: owners.length,
      totalProperties: properties.length,
      publishedProperties,
      pendingProperties,
      rejectedProperties,
      draftProperties,
      totalBookings: bookings.length,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      activeSubscriptions,
      totalRevenue,
      totalBlogs: blogs.length,
      totalEvents: events.length,
      activeDeals: activeDealsCount,
      totalInquiries: inquiries.length,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Admin Dashboard Stats Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Error calculating dashboard metrics" },
      { status: 500 }
    );
  }
}
