export interface FAQItem {
  id: string;
  question: string;
  shortAnswer?: string;
  paragraphs: string[];
  bulletPoints?: string[];
  numberedList?: string[];
  warningBox?: {
    title: string;
    text: string;
  };
  category: string;
  audience: "owner" | "traveller";
}

export const propertyOwnerFaqs: FAQItem[] = [
  {
    id: "owner-docs",
    question: "What documents are required to register my property?",
    paragraphs: [
      "To register as a property owner on Holiday Expertz, begin by completing the onboarding sign-up form with your name, verified phone number, and official email address.",
      "Once your account is created, our partner onboarding team will request the following verification documentation:",
    ],
    bulletPoints: [
      "Government-issued photo identification (Aadhaar, Passport, or PAN card) of the primary owner or authorized property manager.",
      "High-resolution, authentic interior and exterior photographs of the property and its surrounding grounds.",
      "Ownership deed, lease agreement, or property tax receipt verifying legal authorization to let the premises.",
      "Commercial hospitality licenses (e.g. GSTIN, FSSAI, local municipal trade license) where applicable.",
      "Bank account details (cancelled cheque or bank statement) for direct NEFT/RTGS payout transfers.",
    ],
    category: "Onboarding & Registration",
    audience: "owner",
  },
  {
    id: "owner-live-timeline",
    question: "How soon will my property be live on HolidayExpertz?",
    paragraphs: [
      "Our dedicated curation team reviews and audits every property submission within 24 to 48 business hours to ensure our high aesthetic and safety standards are satisfied.",
      "During this curation window, we verify photo resolutions, proofread room descriptions, check location geolocation pins, and ensure pricing transparency. As soon as verification is complete, your property goes live across our search engine, category carousels, and destination guides.",
    ],
    category: "Onboarding & Registration",
    audience: "owner",
  },
  {
    id: "owner-calendar-sync",
    question: "Can I synchronize my existing reservations and calendars?",
    paragraphs: [
      "Yes, absolutely. Holiday Expertz provides comprehensive two-way calendar synchronisation to prevent double bookings across external platforms.",
      "You can effortlessly sync your availability via standard iCal (.ics) calendar links with platforms such as Google Calendar, Airbnb, and Booking.com. For boutique hotels and resort estates, we also support automated channel manager integrations (including Staah, SiteMinder, and eZee) for real-time rates and inventory updates.",
    ],
    category: "Calendar & Management",
    audience: "owner",
  },
  {
    id: "owner-payouts",
    question: "When and how do I receive guest payouts?",
    paragraphs: [
      "Holiday Expertz ensures swift and reliable host settlements. For direct online bookings facilitated through our platform, payouts are dispatched directly to your registered bank account via automated NEFT/RTGS wire transfer within 24–48 hours of guest check-in.",
      "For direct traveller reservations where you collect payment personally, you maintain full control over your preferred payment methods, deposits, and settlement schedule without intermediary delays.",
    ],
    category: "Payments & Payouts",
    audience: "owner",
  },
  {
    id: "owner-partner-plans",
    question: "What are the commission rates and partner plans?",
    paragraphs: [
      "Holiday Expertz offers transparent, host-friendly partner tiers tailored to different scales of hospitality operations:",
    ],
    bulletPoints: [
      "Starter Host (₹0 upfront): Zero subscription fees, standard listing visibility, and a 10% commission per confirmed platform booking.",
      "Verified Luxury Partner (₹4,999/year): Reduced 5% commission, Verified Quality Seal & Audit Badge, priority placement in Handpicked collections, and a dedicated Host Success Manager.",
      "Elite Estate Collection (₹14,999/year): 0% commission on direct bookings, homepage hero spotlight, complimentary drone and video audit, full PMS channel synchronization, and complimentary blog features.",
    ],
    category: "Payments & Payouts",
    audience: "owner",
  },
  {
    id: "owner-multiple-properties",
    question: "Can I list more than one property under a single owner account?",
    paragraphs: [
      "Yes. Property owners, villa management companies, and boutique hotel operators can manage multiple listings under a single centralized host dashboard.",
      "From your dashboard, you can monitor enquiries, update seasonal rates, modify room inventories, and track bookings across all your properties with individual calendar controls.",
    ],
    category: "Calendar & Management",
    audience: "owner",
  },
  {
    id: "owner-guest-enquiries",
    question: "How do guest enquiries and direct booking requests work?",
    paragraphs: [
      "When a traveller is interested in your property, they submit an enquiry through your listing. You receive immediate alerts via email and your host dashboard containing the guest's requested dates, party size, and custom questions.",
      "You can chat directly with the prospective guest, answer their questions, discuss customized tariffs or special package requests, and approve or decline the reservation directly.",
    ],
    category: "Guest Management",
    audience: "owner",
  },
  {
    id: "owner-quality-standards",
    question: "What quality standards or criteria must a property meet?",
    paragraphs: [
      "To ensure an exceptional guest experience, Holiday Expertz curates authentic, quality-focused properties including heritage estates, luxury homestays, boutique resorts, and private villas.",
      "Core standards evaluated during audit include cleanliness, structural safety, accurate and professional high-definition photography, reliable climate control, verified host identity, and authentic guest feedback history.",
    ],
    category: "Onboarding & Registration",
    audience: "owner",
  },
  {
    id: "owner-cancellation-rules",
    question: "Can I set custom cancellation policies and house rules?",
    paragraphs: [
      "Yes. You have complete autonomy over your property's policies. You can configure flexible, moderate, or strict cancellation schedules, define minimum stay requirements, and establish specific house rules (e.g., quiet hours, pet permissions, pool safety, and smoking guidelines).",
      "All policies are prominently displayed to guests prior to enquiry submission to prevent misunderstandings.",
    ],
    category: "Guest Management",
    audience: "owner",
  },
  {
    id: "owner-guest-verification",
    question: "How does Holiday Expertz verify guests?",
    paragraphs: [
      "We maintain a verified guest community. Travellers registering on Holiday Expertz are verified through two-factor authentication, verified mobile numbers, and valid email addresses.",
      "In addition, hosts can require government-issued photo ID verification at check-in to ensure utmost security and peace of mind.",
    ],
    category: "Guest Management",
    audience: "owner",
  },
];

export const travellerFaqs: FAQItem[] = [
  {
    id: "traveller-how-it-works",
    question: "How does Holiday Expertz work?",
    paragraphs: [
      "Holiday Expertz is a curated luxury holiday rental marketplace connecting discerning travellers directly with verified property owners, managers, and boutique hosts.",
      "Travellers can explore handpicked properties across premier destinations, browse authentic high-resolution photography, compare verified amenities, and submit booking requests directly to the host without paying intermediary traveler commissions or inflated markup fees.",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
  {
    id: "traveller-commission",
    question: "Do I have to pay any commission when booking a holiday rental through Holiday Expertz?",
    paragraphs: [
      "No. Holiday Expertz does not charge travellers any booking fees, service surcharges, or guest commissions.",
      "The rental tariffs you see on each property listing are direct rates provided by property hosts, enabling you to secure exceptional accommodation with complete price transparency.",
    ],
    category: "Payments & Pricing",
    audience: "traveller",
  },
  {
    id: "traveller-role",
    question: "What role does Holiday Expertz play in the booking process?",
    paragraphs: [
      "Holiday Expertz operates as an advertising, marketing, and discovery platform designed to connect travellers directly with vetted holiday property owners.",
      "We provide the technology, verified property showcases, search filters, and messaging infrastructure to facilitate direct communication. The actual rental contract, booking agreement, house rules, and financial transaction take place directly between you (the traveller) and the property owner or host.",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
  {
    id: "traveller-search",
    question: "How can I search for holiday rentals in my preferred destination?",
    paragraphs: [
      "Finding your dream stay on Holiday Expertz is fast and intuitive:",
    ],
    bulletPoints: [
      "Enter your destination, city, region, or landmark into the primary search bar.",
      "Select your intended arrival (check-in) and departure (check-out) dates.",
      "Specify your party size, including adults and children.",
      "Refine results using our comprehensive filters, including price range per night, star category, property style (private villas, heritage havelis, luxury resorts), and specific amenities (private pool, Wi-Fi, chef on site, beachfront).",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
  {
    id: "traveller-local-area",
    question: "How can I find more information about the local area?",
    paragraphs: [
      "Each property listing includes a dedicated Location section featuring an interactive map, distance to key landmarks, airport transit times, and local attractions.",
      "Furthermore, when you enquire with a property host, you can ask questions directly about the neighborhood. Local owners know their destinations intimately and are delighted to share insider tips on hidden beaches, top dining spots, and cultural experiences.",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
  {
    id: "traveller-questions-before-booking",
    question: "What if I have questions before deciding to book?",
    paragraphs: [
      "You are encouraged to contact the host directly prior to making any financial commitment. Click the \"Enquire Now\" or \"Contact Host\" button on any listing page to send a direct message.",
      "You can ask about custom check-in/check-out timings, accessibility requirements, pet allowances, private chef services, vehicle rentals, or seasonal weather conditions.",
    ],
    category: "Direct Communication",
    audience: "traveller",
  },
  {
    id: "traveller-make-booking",
    question: "How do I make a booking?",
    paragraphs: [
      "Booking your holiday rental involves five simple steps:",
    ],
    numberedList: [
      "Browse our curated portfolio and select your preferred holiday rental.",
      "Review the property details, photo gallery, included amenities, house rules, and pricing.",
      "Click \"Enquire Now\" or \"Book Now\" and submit your requested dates and group details to the host.",
      "The property owner will review your enquiry and respond with availability confirmation, the final rental quotation, and payment instructions.",
      "Complete the agreed payment directly with the host to secure your reservation. The host will promptly issue your formal booking confirmation voucher, check-in instructions, and key exchange details.",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
  {
    id: "traveller-precautions-deposit",
    question: "What precautions should I take before paying a booking deposit?",
    paragraphs: [
      "To ensure total safety and peace of mind when reserving a holiday rental, we urge all travellers to follow these essential security precautions:",
    ],
    bulletPoints: [
      "Always communicate with the property owner or manager via phone or verified messaging before remitting funds.",
      "Request and carefully review a written booking agreement detailing your check-in/out dates, deposit amount, balance payment schedule, and cancellation terms.",
      "Ensure you receive an itemized invoice bearing the official property name, address, and host details.",
    ],
    warningBox: {
      title: "IMPORTANT SAFETY WARNING",
      text: "Never send money via untraceable payment methods such as Western Union, MoneyGram, cryptocurrency, or direct cash transfers to personal accounts. Always use secure, traceable payment methods such as verified credit cards, debit cards, PayPal, or established bank transfers directly to the verified entity.",
    },
    category: "Payments & Pricing",
    audience: "traveller",
  },
  {
    id: "traveller-no-response",
    question: "What should I do if I do not receive a response to my booking enquiry?",
    paragraphs: [
      "The vast majority of our hosts respond within 12 to 24 hours. If you have not received a reply within 48 hours:",
    ],
    bulletPoints: [
      "Check your email spam or junk folder to verify that notification messages were not filtered.",
      "Send a polite follow-up message through the enquiry portal.",
      "If the owner remains unreachable, we advise exploring alternative verified properties in the same destination to avoid travel delays.",
    ],
    category: "Direct Communication",
    audience: "traveller",
  },
  {
    id: "traveller-save-favourites",
    question: "How can I save my favourite properties?",
    paragraphs: [
      "When browsing holiday rentals on Holiday Expertz, simply click the Heart icon on any property card or listing header to add it to your personal shortlist.",
      "When signed in to your Traveller account, all your saved properties are neatly organized in your Traveller Dashboard, allowing you to compare options with travel companions at any time.",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
  {
    id: "traveller-how-to-pay",
    question: "How should I pay for my holiday rental booking?",
    paragraphs: [
      "Payment procedures are agreed upon directly with the property host according to their established terms. Always choose traceable, secure payment channels:",
    ],
    bulletPoints: [
      "Major credit or debit cards (Visa, Mastercard, American Express) providing chargeback and fraud protection.",
      "Traceable electronic bank wire transfers (NEFT / RTGS / IMPS) sent directly to the verified business account of the property or host company.",
      "Verified online payment platforms like PayPal.",
    ],
    category: "Payments & Pricing",
    audience: "traveller",
  },
  {
    id: "traveller-negotiate-price",
    question: "Can I negotiate the price of a holiday rental?",
    paragraphs: [
      "Tariffs are determined by the individual property owners based on season, demand, and group size. While published rates reflect standard pricing, hosts are frequently receptive to polite discussions regarding:",
    ],
    bulletPoints: [
      "Extended stays of one week, two weeks, or monthly rentals.",
      "Off-peak or shoulder season travel dates.",
      "Filling calendar gaps between confirmed bookings.",
      "Smaller travel groups booking larger villas.",
    ],
    category: "Payments & Pricing",
    audience: "traveller",
  },
  {
    id: "traveller-guarantee",
    question: "Does Holiday Expertz guarantee my reservation?",
    paragraphs: [
      "Holiday Expertz is an advertising, marketing, and connection platform; we do not own, manage, or operate the individual holiday properties, nor do we act as an insurer of rental transactions.",
      "While we curate properties and authenticate host credentials to uphold stringent standards of trust and transparency, all booking contracts and financial settlements are executed directly between you and the host. For maximum protection, we strongly advise travellers to obtain comprehensive travel insurance covering unforeseen cancellations and always adhere to safe payment practices.",
    ],
    category: "Booking & General",
    audience: "traveller",
  },
];

