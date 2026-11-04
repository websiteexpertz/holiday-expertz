export type EventCategory =
  | "All"
  | "Festival"
  | "Music"
  | "Cultural"
  | "Adventure"
  | "Food"
  | "Wellness";

export interface EventItem {
  id: string;
  slug?: string;
  title: string;
  category: Exclude<EventCategory, "All">;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  time: string; // e.g. "6:00 PM - 11:00 PM"
  location: string; // venue name
  city: string;
  state: string;
  country?: string;
  image: string;
  description: string;
  longDescription: string;
  price: number | "Free Entry";
  originalPrice?: number;
  organizer: string;
  highlights: string[];
  ticketStatus: "Available" | "Selling Fast" | "Free Registration";
  featured?: boolean;
}
