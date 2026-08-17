import {
  BarChart3,
  Bell,
  Calendar,
  CalendarPlus,
  DollarSign,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/**
 * The vendor console's navigation, as data.
 *
 * One definition read by BOTH the rail (`components/Navigation.tsx`) and the
 * ⌘K palette (`components/VendorCommandPalette.tsx`), for the same reason the
 * admin keeps `adminNav.ts`: the admin's palette used to carry its own
 * hand-typed route list and had already drifted out of sync with the sidebar.
 * A page added here shows up in both surfaces at once.
 *
 * Grouped by the JOB, not by page count. The rail used to be one seven-item
 * "Main Menu" plus a four-item "Support" bucket, which told a vendor nothing
 * about what the product does — Revenue sat between Offerings and Marketing
 * with no signal that one is a thing you MANAGE and the other a thing you READ.
 * These four captions match how a vendor thinks about their week: run the
 * business, check how it went, talk to people, manage the account.
 */

export interface VendorNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  /** Extra terms the palette should match on — synonyms the label doesn't carry. */
  keywords?: string;
  children?: VendorNavItem[];
  /** Chrome, not a destination — excluded from the palette's page list. */
  external?: boolean;
}

export interface VendorNavSection {
  id: string;
  label: string;
  items: VendorNavItem[];
}

export const VENDOR_NAV: VendorNavSection[] = [
  {
    id: "business",
    label: "Business",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        keywords: "home overview summary today",
      },
      {
        id: "bookings",
        label: "Bookings",
        icon: Calendar,
        path: "/bookings",
        keywords: "reservations calendar guests trips",
        children: [
          {
            id: "all-bookings",
            label: "All bookings",
            icon: Calendar,
            path: "/bookings",
            keywords: "calendar list",
          },
          {
            id: "booking-details",
            label: "Booking records",
            icon: FileText,
            path: "/bookings/details",
            keywords: "table export history",
          },
          // Create lives in the nav (mirrors Offerings › Add new) rather than as
          // a button repeated on each bookings page.
          {
            id: "new-booking",
            label: "New booking",
            icon: CalendarPlus,
            path: "/bookings/new",
            keywords: "create add manual reservation",
          },
        ],
      },
      {
        id: "offering",
        label: "Offerings",
        icon: Package,
        path: "/offering",
        keywords: "listings inventory caravans stays activities",
        children: [
          { id: "all-offerings", label: "All offerings", icon: Package, path: "/offering" },
          {
            id: "add-offering",
            label: "Add new offering",
            icon: Package,
            path: "/offering/add",
            keywords: "create list publish",
          },
        ],
      },
      /* Promoted out of Marketing's children. A promotion is something you
         create and operate alongside a listing, not a report; burying the
         feature most likely to move bookings one level down cost two clicks and
         a guess. The ROUTE is unchanged — this is information architecture, not
         routing. */
      {
        id: "offers",
        label: "Offers",
        icon: Tag,
        path: "/marketing/offers",
        keywords: "promotions discounts coupons deals",
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    items: [
      {
        id: "revenue",
        label: "Revenue",
        icon: DollarSign,
        path: "/revenue",
        keywords: "earnings payouts payments money income",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        path: "/analytics",
        keywords: "insights reports trends conversion",
      },
      {
        id: "marketing",
        label: "Marketing",
        icon: Megaphone,
        path: "/marketing",
        keywords: "campaigns posts reach promotion social",
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      {
        id: "messages",
        label: "Messages",
        icon: MessageSquare,
        path: "/vendor-chat",
        keywords: "chat inbox conversations guests",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        path: "/notifications",
        keywords: "alerts activity updates",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: UserRound,
        path: "/profile",
        keywords: "business details personal kyc documents",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/settings",
        keywords: "preferences security password notifications payout",
      },
      {
        id: "help",
        label: "Help & support",
        icon: HelpCircle,
        path: "/help",
        keywords: "faq contact support docs",
      },
      {
        id: "visit-site",
        label: "Visit site",
        icon: Globe,
        path: "/",
        keywords: "public storefront travelhomes",
        external: true,
      },
    ],
  },
];

/** Flat view of every top-level row — used for the active-parent lookup. */
export const VENDOR_NAV_ITEMS: VendorNavItem[] = VENDOR_NAV.flatMap((s) => s.items);
