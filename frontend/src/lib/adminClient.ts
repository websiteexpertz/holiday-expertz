import {
  AdminPermission,
  AdminUser,
  DashboardMetricOverview,
  CountryRecord,
  StateRecord,
  CityRecord,
  AreaRecord,
  DestinationHierarchyCounts,
  DestinationHeroImage,
  FeaturedDestination,
  BookingRecord,
  PaymentRecord,
  BlogPostRecord,
  EventRecord,
  DealRecord,
  ReviewRecord,
  ContactInquiryRecord,
  WebsiteContentRecord,
  WebsiteSettingsRecord,
  CustomerUserRecord,
  AuditLogRecord,
} from "@backend/types/admin";
import { Property } from "@backend/types/property";
import { MemoryRecord, MemoryInput } from "@backend/types/memory";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const res = await fetch(endpoint, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      return {
        success: false,
        message: json.message || "An error occurred during request",
      };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Network communication failed",
    };
  }
}

export const adminClient = {
  auth: {
    login: async (credentials: { email: string; pass: string }) => {
      const res = await request<{ admin: AdminUser; token: string }>("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: credentials.email, password: credentials.pass }),
      });
      if (res.success && res.data?.token && typeof window !== "undefined") {
        localStorage.setItem("admin_token", res.data.token);
      }
      return res;
    },
    me: async () => {
      return request<{ admin: AdminUser }>("/api/admin/auth/me", { method: "GET" });
    },
    logout: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
      }
      return request<{ message: string }>("/api/admin/auth/logout", { method: "POST" });
    },
  },

  dashboard: {
    getStats: async () => {
      return request<{ stats: DashboardMetricOverview }>("/api/admin/dashboard/stats", { method: "GET" });
    },
  },

  destinations: {
    getAll: async () => {
      return request<{
        counts: DestinationHierarchyCounts;
        countries: CountryRecord[];
        states: StateRecord[];
        cities: CityRecord[];
        areas: AreaRecord[];
      }>("/api/admin/destinations", { method: "GET" });
    },
    getHierarchyTree: async () => {
      return request<{ tree: any[]; counts: DestinationHierarchyCounts }>("/api/admin/destinations?hierarchy=true", { method: "GET" });
    },
    create: async (entityType: "country" | "state" | "city" | "area", payload: any) => {
      return request<{ data: any; counts: DestinationHierarchyCounts }>("/api/admin/destinations", {
        method: "POST",
        body: JSON.stringify({ entityType, ...payload }),
      });
    },
    update: async (entityType: "country" | "state" | "city" | "area", id: string, updates: any) => {
      return request<{ data: any }>("/api/admin/destinations", {
        method: "PUT",
        body: JSON.stringify({ entityType, id, updates }),
      });
    },
    delete: async (entityType: "country" | "state" | "city" | "area", id: string) => {
      return request<{ message: string; counts: DestinationHierarchyCounts }>(
        `/api/admin/destinations?entityType=${entityType}&id=${id}`,
        { method: "DELETE" }
      );
    },
    getProperties: async (filters: { countryId?: string; stateId?: string; cityId?: string; areaId?: string }) => {
      const q = new URLSearchParams();
      q.set("type", "properties");
      if (filters.countryId) q.set("countryId", filters.countryId);
      if (filters.stateId) q.set("stateId", filters.stateId);
      if (filters.cityId) q.set("cityId", filters.cityId);
      if (filters.areaId) q.set("areaId", filters.areaId);
      return request<{ properties: Property[] }>(`/api/admin/destinations?${q.toString()}`, { method: "GET" });
    },
  },

  destinationHeroImages: {
    getAll: async (params?: { countryId?: string; stateId?: string; all?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.countryId) q.set("countryId", params.countryId);
      if (params?.stateId) q.set("stateId", params.stateId);
      if (params?.all) q.set("all", "true");
      return request<{ images: DestinationHeroImage[]; total: number }>(
        `/api/admin/destinations/hero-images?${q.toString()}`,
        { method: "GET" }
      );
    },
    create: async (payload: Partial<DestinationHeroImage>) => {
      return request<{ image: DestinationHeroImage }>("/api/admin/destinations/hero-images", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update: async (id: string, updates: Partial<DestinationHeroImage>) => {
      return request<{ image: DestinationHeroImage }>("/api/admin/destinations/hero-images", {
        method: "PUT",
        body: JSON.stringify({ id, updates }),
      });
    },
    reorder: async (orderedIds: string[]) => {
      return request<{ images: DestinationHeroImage[] }>("/api/admin/destinations/hero-images", {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/destinations/hero-images?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },

  featuredDestinations: {
    getAll: async () => {
      return request<{ destinations: FeaturedDestination[]; total: number }>(
        "/api/admin/featured-destinations",
        { method: "GET" }
      );
    },
    create: async (payload: Omit<FeaturedDestination, "id" | "createdAt" | "updatedAt">) => {
      return request<{ destination: FeaturedDestination }>("/api/admin/featured-destinations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update: async (id: string, updates: Partial<FeaturedDestination>) => {
      return request<{ destination: FeaturedDestination }>("/api/admin/featured-destinations", {
        method: "PUT",
        body: JSON.stringify({ id, ...updates }),
      });
    },
    reorder: async (orderedIds: string[]) => {
      return request<{ destinations: FeaturedDestination[] }>("/api/admin/featured-destinations", {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(
        `/api/admin/featured-destinations?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
    },
  },

  memories: {
    getAll: async (params?: { status?: string; source?: string; isPublished?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.source) q.set("source", params.source);
      if (params?.isPublished) q.set("isPublished", params.isPublished);
      if (params?.search) q.set("search", params.search);
      return request<{ memories: MemoryRecord[]; total: number }>(`/api/admin/memories?${q.toString()}`, {
        method: "GET",
      });
    },
    create: async (payload: MemoryInput) => {
      return request<{ memory: MemoryRecord }>("/api/admin/memories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update: async (id: string, updates: Partial<MemoryInput>) => {
      return request<{ memory: MemoryRecord }>("/api/admin/memories", {
        method: "PATCH",
        body: JSON.stringify({ id, ...updates }),
      });
    },
    approve: async (id: string) => {
      return request<{ memory: MemoryRecord }>("/api/admin/memories", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "approve" }),
      });
    },
    reject: async (id: string, rejectionReason?: string) => {
      return request<{ memory: MemoryRecord }>("/api/admin/memories", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "reject", rejectionReason }),
      });
    },
    togglePublish: async (id: string) => {
      return request<{ memory: MemoryRecord }>("/api/admin/memories", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "toggle_publish" }),
      });
    },
    toggleActive: async (id: string) => {
      return request<{ memory: MemoryRecord }>("/api/admin/memories", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "toggle_active" }),
      });
    },
    reorder: async (orderedIds: string[]) => {
      return request<{ memories: MemoryRecord[] }>("/api/admin/memories", {
        method: "PATCH",
        body: JSON.stringify({ action: "reorder", orderedIds }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/memories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    clearDemo: async () => {
      return request<{ message: string; deletedCount: number }>("/api/admin/memories?cleanDemo=true", {
        method: "DELETE",
      });
    },
  },

  properties: {
    getAll: async (params?: { status?: string; propertyType?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.propertyType) q.set("propertyType", params.propertyType);
      if (params?.search) q.set("search", params.search);
      return request<{ properties: (Property & { ownerName: string })[]; total: number }>(
        `/api/admin/properties?${q.toString()}`,
        { method: "GET" }
      );
    },
    approve: async (id: string) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "approve" }),
      });
    },
    reject: async (id: string, rejectionReason: string) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "reject", rejectionReason }),
      });
    },
    togglePause: async (id: string) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "toggle_pause" }),
      });
    },
    toggleFeatured: async (id: string) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "toggle_featured" }),
      });
    },
    toggleHandpicked: async (id: string) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "toggle_handpicked" }),
      });
    },
    updateHierarchy: async (id: string, hierarchy: any) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "update_hierarchy", hierarchy }),
      });
    },
    create: async (payload: any) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    edit: async (id: string, updates: any) => {
      return request<{ property: Property }>("/api/admin/properties", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "edit_details", ...updates }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/properties?id=${id}`, { method: "DELETE" });
    },
  },

  owners: {
    getAll: async () => {
      return request<{ owners: any[] }>("/api/admin/owners", { method: "GET" });
    },
    create: async (data: {
      fullName: string;
      email: string;
      mobileNumber: string;
      password?: string;
      businessName?: string;
      status?: "active" | "pending_review" | "suspended";
      address?: string;
      bio?: string;
      altPhone?: string;
    }) => {
      return request<{ owner: any; tempPassword?: string; message?: string }>("/api/admin/owners", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateStatus: async (id: string, status: "active" | "pending" | "suspended") => {
      return request<{ owner: any }>("/api/admin/owners", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/owners?id=${id}`, { method: "DELETE" });
    },
  },

  users: {
    getAll: async () => {
      return request<{ customers: CustomerUserRecord[] }>("/api/admin/users", { method: "GET" });
    },
    updateStatus: async (id: string, status: "active" | "suspended") => {
      return request<{ customer: CustomerUserRecord }>("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
    },
  },

  bookings: {
    getAll: async (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      return request<{ bookings: BookingRecord[]; total: number }>(`/api/admin/bookings?${q.toString()}`, { method: "GET" });
    },
    update: async (id: string, updates: Partial<BookingRecord>) => {
      return request<{ booking: BookingRecord }>("/api/admin/bookings", {
        method: "PATCH",
        body: JSON.stringify({ id, ...updates }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/bookings?id=${id}`, { method: "DELETE" });
    },
  },

  payments: {
    getAll: async (params?: { type?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set("type", params.type);
      if (params?.status) q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      return request<{ payments: PaymentRecord[]; total: number; metrics: any }>(`/api/admin/payments?${q.toString()}`, {
        method: "GET",
      });
    },
    updateStatus: async (id: string, status: PaymentRecord["status"], refundedAmount?: number) => {
      return request<{ payment: PaymentRecord }>("/api/admin/payments", {
        method: "PATCH",
        body: JSON.stringify({ id, status, refundedAmount }),
      });
    },
  },

  blogs: {
    getAll: async () => {
      return request<{ blogs: BlogPostRecord[] }>("/api/admin/blogs", { method: "GET" });
    },
    create: async (payload: Partial<BlogPostRecord>) => {
      return request<{ blog: BlogPostRecord }>("/api/admin/blogs", { method: "POST", body: JSON.stringify(payload) });
    },
    update: async (id: string, updates: Partial<BlogPostRecord>) => {
      return request<{ blog: BlogPostRecord }>("/api/admin/blogs", { method: "PUT", body: JSON.stringify({ id, ...updates }) });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/blogs?id=${id}`, { method: "DELETE" });
    },
  },

  events: {
    getAll: async () => {
      return request<{ events: EventRecord[] }>("/api/admin/events", { method: "GET" });
    },
    create: async (payload: Partial<EventRecord>) => {
      return request<{ event: EventRecord }>("/api/admin/events", { method: "POST", body: JSON.stringify(payload) });
    },
    update: async (id: string, updates: Partial<EventRecord>) => {
      return request<{ event: EventRecord }>("/api/admin/events", { method: "PUT", body: JSON.stringify({ id, ...updates }) });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/events?id=${id}`, { method: "DELETE" });
    },
  },

  deals: {
    getAll: async () => {
      return request<{ deals: DealRecord[] }>("/api/admin/deals", { method: "GET" });
    },
    create: async (payload: Partial<DealRecord>) => {
      return request<{ deal: DealRecord }>("/api/admin/deals", { method: "POST", body: JSON.stringify(payload) });
    },
    update: async (id: string, updates: Partial<DealRecord>) => {
      return request<{ deal: DealRecord }>("/api/admin/deals", { method: "PUT", body: JSON.stringify({ id, ...updates }) });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/deals?id=${id}`, { method: "DELETE" });
    },
  },

  handpicked: {
    getAll: async () => {
      return request<{ handpicked: any[]; availableProperties: Property[] }>("/api/admin/handpicked", { method: "GET" });
    },
    add: async (propertyId: string, badge?: string, priorityOrder?: number, featuredQuote?: string) => {
      return request<{ item: any }>("/api/admin/handpicked", {
        method: "POST",
        body: JSON.stringify({ propertyId, badge, priorityOrder, featuredQuote }),
      });
    },
    update: async (id: string, updates: any) => {
      return request<{ item: any }>("/api/admin/handpicked", { method: "PATCH", body: JSON.stringify({ id, ...updates }) });
    },
    remove: async (id: string) => {
      return request<{ message: string }>(`/api/admin/handpicked?id=${id}`, { method: "DELETE" });
    },
  },

  content: {
    get: async () => {
      return request<{ content: WebsiteContentRecord }>("/api/admin/content", { method: "GET" });
    },
    update: async (updates: Partial<WebsiteContentRecord>) => {
      return request<{ content: WebsiteContentRecord }>("/api/admin/content", { method: "PUT", body: JSON.stringify(updates) });
    },
  },

  reviews: {
    getAll: async () => {
      return request<{ reviews: ReviewRecord[] }>("/api/admin/reviews", { method: "GET" });
    },
    update: async (id: string, updates: Partial<ReviewRecord>) => {
      return request<{ review: ReviewRecord }>("/api/admin/reviews", { method: "PATCH", body: JSON.stringify({ id, ...updates }) });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    },
  },

  inquiries: {
    getAll: async (status?: string) => {
      const q = status ? `?status=${status}` : "";
      return request<{ inquiries: ContactInquiryRecord[] }>(`/api/admin/inquiries${q}`, { method: "GET" });
    },
    update: async (id: string, updates: Partial<ContactInquiryRecord>) => {
      return request<{ inquiry: ContactInquiryRecord }>("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id, ...updates }) });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/inquiries?id=${id}`, { method: "DELETE" });
    },
  },

  admins: {
    getAll: async () => {
      return request<{ admins: AdminUser[]; permissionGroups: any[] }>("/api/admin/admins", { method: "GET" });
    },
    create: async (payload: { fullName: string; email: string; password: string; role: string; permissions: string[] }) => {
      return request<{ admin: AdminUser }>("/api/admin/admins", { method: "POST", body: JSON.stringify(payload) });
    },
    update: async (id: string, updates: any) => {
      return request<{ admin: AdminUser }>("/api/admin/admins", { method: "PUT", body: JSON.stringify({ id, ...updates }) });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/admin/admins?id=${id}`, { method: "DELETE" });
    },
  },

  auditLogs: {
    getAll: async (params?: { module?: string; adminId?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.module) q.set("module", params.module);
      if (params?.adminId) q.set("adminId", params.adminId);
      if (params?.limit) q.set("limit", params.limit.toString());
      return request<{ logs: AuditLogRecord[]; total: number }>(`/api/admin/audit-logs?${q.toString()}`, { method: "GET" });
    },
  },

  settings: {
    get: async () => {
      return request<{ settings: WebsiteSettingsRecord }>("/api/admin/settings", { method: "GET" });
    },
    update: async (updates: Partial<WebsiteSettingsRecord>) => {
      return request<{ settings: WebsiteSettingsRecord }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(updates) });
    },
  },

  media: {
    getAll: async () => {
      return request<{ media: any[]; total: number }>("/api/admin/media", { method: "GET" });
    },
    upload: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      return res.json();
    },
  },
};
