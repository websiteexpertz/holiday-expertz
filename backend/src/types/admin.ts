export type AdminRole = "super_admin" | "custom_admin";

export type AdminStatus = "active" | "inactive" | "suspended";

export type AdminPermission =
  | "dashboard.view"
  | "destinations.view"
  | "destinations.create"
  | "destinations.update"
  | "destinations.delete"
  | "properties.view"
  | "properties.create"
  | "properties.approve"
  | "properties.reject"
  | "properties.update"
  | "properties.delete"
  | "properties.publish"
  | "owners.view"
  | "owners.create"
  | "owners.update"
  | "owners.suspend"
  | "users.view"
  | "users.update"
  | "users.suspend"
  | "bookings.view"
  | "bookings.update"
  | "bookings.cancel"
  | "subscriptions.view"
  | "subscriptions.manage"
  | "payments.view"
  | "payments.refund"
  | "blogs.view"
  | "blogs.create"
  | "blogs.update"
  | "blogs.publish"
  | "blogs.delete"
  | "events.view"
  | "events.create"
  | "events.update"
  | "events.publish"
  | "events.delete"
  | "handpicked.view"
  | "handpicked.manage"
  | "deals.view"
  | "deals.create"
  | "deals.update"
  | "deals.publish"
  | "deals.delete"
  | "content.view"
  | "content.update"
  | "reviews.view"
  | "reviews.moderate"
  | "reviews.delete"
  | "inquiries.view"
  | "inquiries.update"
  | "inquiries.delete"
  | "media.view"
  | "media.upload"
  | "media.delete"
  | "reports.view"
  | "reports.export"
  | "admins.view"
  | "admins.create"
  | "admins.update_permissions"
  | "admins.deactivate"
  | "audit_logs.view"
  | "settings.view"
  | "settings.update";

export interface PermissionModuleGroup {
  id: string;
  name: string;
  description: string;
  permissions: {
    key: AdminPermission;
    label: string;
    description: string;
  }[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  status: AdminStatus;
  avatar?: string;
  department?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRecord extends AdminUser {
  passwordHash: string;
  passwordSalt: string;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  module: string;
  action: string;
  resourceId?: string;
  resourceType?: string;
  details: string;
  before?: unknown;
  after?: unknown;
  status: "success" | "failure";
  ipAddress?: string;
  createdAt: string;
}

// ── Destination Hierarchy ──
export interface CountryRecord {
  id: string;
  name: string;
  code: string;
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StateRecord {
  id: string;
  name: string;
  countryId: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CityRecord {
  id: string;
  name: string;
  stateId: string;
  countryId: string;
  image?: string;
  isPopular?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AreaRecord {
  id: string;
  name: string;
  cityId: string;
  stateId: string;
  countryId: string;
  postalCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationHierarchyCounts {
  countriesCount: number;
  statesCount: number;
  citiesCount: number;
  areasCount: number;
  propertiesCount: number;
}

// ── Destination Hero Slideshow Images ──
export interface DestinationHeroImage {
  id: string;
  destinationType: "country" | "state";
  countryId: string;
  stateId?: string;
  title: string;
  locationName?: string;
  headline?: string;       // e.g. "A Timeless Symbol of Love" — italic gold overlay text
  description?: string;    // Short editorial description shown in right-side panel
  imageUrl: string;
  altText: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Featured Destinations (Destination Collections section) ──
export interface FeaturedDestination {
  id: string;
  name: string;                // e.g. "Taj Mahal"
  countryId: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  imageUrl: string;
  headline: string;            // e.g. "A Timeless Symbol of Love"
  description: string;         // Short editorial description
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Bookings & Payments ──
export interface BookingRecord {
  id: string;
  bookingReference: string;
  propertyId: string;
  propertyName: string;
  propertyCoverImage: string;
  propertyCity: string;
  ownerId: string;
  ownerName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalAmount: number;
  currency: string;
  bookingStatus: "confirmed" | "completed" | "cancelled" | "pending";
  paymentStatus: "paid" | "refunded" | "pending" | "failed";
  cancellationReason?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  transactionReference: string;
  bookingId?: string;
  bookingReference?: string;
  ownerId?: string;
  payerName: string;
  payerEmail: string;
  amount: number;
  currency: string;
  type: "booking_payment" | "subscription_fee" | "payout" | "refund";
  gateway: "Razorpay" | "Stripe" | "UPI" | "Direct Bank";
  status: "successful" | "failed" | "refunded" | "pending";
  refundedAmount?: number;
  gatewayTransactionId?: string;
  createdAt: string;
}

// ── Blog, Events, Deals, Content ──
export interface BlogCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order?: number;
  blogCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostRecord {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  categorySlug?: string;
  author: string;
  authorAvatar?: string;
  authorRole?: string;
  readTime: string;
  status: "published" | "draft" | "scheduled" | "archived";
  featured: boolean;
  isInformative?: boolean;
  tags?: string[];
  additionalImages?: Array<{ url: string; alt?: string; caption?: string }>;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  time?: string;
  location: string;
  city: string;
  state: string;
  country?: string;
  category: string;
  price?: number | string;
  highlights?: string[];
  organizer?: string;
  registrationLink?: string;
  status: "published" | "draft" | "archived";
  featured: boolean;
  timezone?: string;
  publishAt?: string;
  unpublishAt?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: "annual" | "none";
  seriesId?: string;
  editionYear?: number;
  source?: "manual" | "official_feed" | string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  promoImage: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  couponCode?: string;
  startDate: string;
  endDate: string;
  applicableCategory?: string;
  applicablePropertyIds?: string[];
  status: "active" | "inactive" | "expired";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  author: string;
  avatar?: string;
  rating: number; // 1-5
  comment: string;
  propertyName?: string;
  propertyId?: string;
  location: string;
  status: "approved" | "pending" | "hidden";
  featured: boolean;
  createdAt: string;
}

export interface ContactInquiryRecord {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  relatedPropertyId?: string;
  relatedPropertyName?: string;
  status: "new" | "in_progress" | "resolved" | "archived";
  adminNotes?: string;
  assignedToAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlideItem {
  id: string;
  imageUrl: string;
  altText: string;
  title: string;
  category: "Mountain Retreats" | "Private Villas" | "Heritage Stays" | "Riverside Escapes" | string;
  order: number;
  isActive: boolean;
}

export interface HeroBannerContentSlot {
  slotIndex: number; // 0, 1, 2, 3
  slideNumber: number; // 1, 2, 3, 4
  heading: string;
  description: string;
  updatedAt: string;
}

export interface HeroBannerContentRecord {
  slots: HeroBannerContentSlot[];
  updatedAt: string;
}

export interface WebsiteHeroContent {
  headline: string;
  subheadline: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  backgroundImages: string[];
  slides?: HeroSlideItem[];
}

export interface WhyChooseUsCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface WebsiteContentRecord {
  hero: WebsiteHeroContent;
  whyChooseUs: WhyChooseUsCard[];
  aboutSummary: {
    title: string;
    description: string;
    yearsInService: number;
    propertiesManaged: number;
    happyTravelers: number;
    destinationsCovered: number;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    whatsappNumber: string;
    officeHours: string;
  };
  updatedAt: string;
}

export interface WebsiteSettingsRecord {
  siteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  currencySymbol: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  enableGuestReviews: boolean;
  allowInstantBooking: boolean;
  autoApproveProperties: boolean;
  maintenanceMode: boolean;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  updatedAt: string;
}

export interface CustomerUserRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: "active" | "suspended";
  avatar?: string;
  city?: string;
  country?: string;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetricOverview {
  totalCustomers: number;
  totalPropertyOwners: number;
  totalProperties: number;
  publishedProperties: number;
  pendingProperties: number;
  rejectedProperties: number;
  draftProperties: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalBlogs: number;
  totalEvents: number;
  activeDeals: number;
  totalInquiries: number;
  recentActivity: AuditLogRecord[];
}
