import React from "react";
import {
  Accessibility,
  Anchor,
  Archive,
  Armchair,
  Baby,
  Backpack,
  Bandage,
  Bath,
  BatteryCharging,
  Bed,
  BedDouble,
  BedSingle,
  Beer,
  Bike,
  Binoculars,
  Cable,
  Camera,
  CarFront,
  Cctv,
  ChefHat,
  CigaretteOff,
  Clock,
  Coffee,
  CookingPot,
  Croissant,
  Dog,
  DoorOpen,
  Droplets,
  Dumbbell,
  Fan,
  FireExtinguisher,
  Flame,
  Flower2,
  Footprints,
  Fuel,
  Gamepad2,
  GlassWater,
  Guitar,
  Hammer,
  HandPlatter,
  Headphones,
  Heart,
  HeartPulse,
  Key,
  Landmark,
  Layers,
  Leaf,
  LifeBuoy,
  Lightbulb,
  LocateFixed,
  Lock,
  Luggage,
  MapPin,
  Microwave,
  Mountain,
  Music,
  PawPrint,
  Phone,
  Plug,
  Popcorn,
  Printer,
  RectangleVertical,
  Refrigerator,
  Route,
  Salad,
  Ship,
  Shirt,
  ShowerHead,
  Shrub,
  Snowflake,
  Sofa,
  Sparkles,
  Speaker,
  Sun,
  Sunrise,
  Table,
  Tent,
  Thermometer,
  Ticket,
  Toilet,
  Trees,
  Trophy,
  Tv2,
  Umbrella,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  WashingMachine,
  Zap,
  Bus,
  Building2,
  Caravan,
  Castle,
  Compass,
  Fish,
  Hotel,
  House,
  TreePine,
  Truck,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * One icon system for CMS features, shared by admin and every vendor-facing
 * step.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * A name→icon map like this already existed, but only inside
 * `onboarding/caravan/FeaturesStep.tsx`. The activity and stays steps rendered
 * a bare `<img src={getImageUrl(feature.icon)}>` with no fallback — and since
 * no feature in the database has an icon (`icon` is `""` on all 50 Camper Van
 * rows), those two steps showed an empty 18px box beside every single pill.
 *
 * So resolution happens in one place, in this order:
 *
 *   1. `lucide:<name>` — an icon the admin picked from the library.
 *   2. An uploaded image path — an admin's own artwork still wins over a guess.
 *   3. Inferred from the feature's *name* — exact match, then keyword match.
 *   4. `Sparkles`, so an unrecognised feature is still a proper pill.
 *
 * Step 3 is the important one: it means every existing feature gets a sensible
 * icon with no admin work at all, and a newly added "Outdoor Shower" is
 * recognised the moment it's typed.
 */

/** Stored in `Feature.icon` as `lucide:wifi`. Well inside the server's
    500-character cap on that field, so it needs no schema change. */
export const LUCIDE_PREFIX = "lucide:";

/** lucide's own component type — the icons are `forwardRef` components, so a
    hand-rolled `ComponentType<{size, className}>` does not accept them. */
export type IconComponent = LucideIcon;

/**
 * The pickable library. Keys are the stored token (`lucide:wifi` → `wifi`);
 * `keywords` drive both the picker's search and the name inference below.
 *
 * Curated rather than all ~1,500 lucide icons: a picker showing everything is
 * a worse picker, and these are the concepts that actually appear in stays,
 * camper vans and activities.
 */
export const ICON_LIBRARY: Record<
  string,
  { Icon: IconComponent; label: string; group: string; keywords: string[] }
> = {
  // ── Climate ──
  wind: { Icon: Wind, label: "Air conditioning", group: "Climate", keywords: ["air conditioning", "ac", "cooling", "air"] },
  flame: { Icon: Flame, label: "Heating", group: "Climate", keywords: ["heating", "heater", "fire", "bbq", "barbecue", "grill", "bonfire", "campfire"] },
  thermometer: { Icon: Thermometer, label: "Insulation", group: "Climate", keywords: ["insulation", "temperature", "climate"] },
  fan: { Icon: Fan, label: "Fan", group: "Climate", keywords: ["fan", "ventilation", "exhaust"] },
  snowflake: { Icon: Snowflake, label: "Cold / winter", group: "Climate", keywords: ["cold", "winter", "snow", "freezer", "ice"] },

  // ── Sleeping ──
  "bed-double": { Icon: BedDouble, label: "Double bed", group: "Sleeping", keywords: ["double bed", "king bed", "queen bed", "sleeping beds", "bedroom", "double"] },
  "bed-single": { Icon: BedSingle, label: "Single bed", group: "Sleeping", keywords: ["single bed", "twin bed", "single beds"] },
  bed: { Icon: Bed, label: "Bedding", group: "Sleeping", keywords: ["pillows", "bedding", "linen", "mattress", "bed"] },
  layers: { Icon: Layers, label: "Bunk beds", group: "Sleeping", keywords: ["bunk beds", "bunk", "stacked"] },
  shirt: { Icon: Shirt, label: "Blankets / linen", group: "Sleeping", keywords: ["blankets", "towels", "duvet", "quilt"] },

  // ── Living ──
  sofa: { Icon: Sofa, label: "Sofa / lounge", group: "Living", keywords: ["sofa", "lounge", "couch", "seating", "living room", "sofa cum bed"] },
  armchair: { Icon: Armchair, label: "Chairs", group: "Living", keywords: ["recliner", "chairs", "camping chairs", "armchair", "seat"] },
  archive: { Icon: Archive, label: "Storage", group: "Living", keywords: ["storage", "cabinets", "wardrobe", "cupboard"] },
  table: { Icon: Table, label: "Table", group: "Living", keywords: ["table", "dining table", "camping table", "desk", "workspace"] },
  "rectangle-vertical": { Icon: RectangleVertical, label: "Mirror", group: "Living", keywords: ["mirror", "glass"] },

  // ── Kitchen ──
  "cooking-pot": { Icon: CookingPot, label: "Stove / cooking", group: "Kitchen", keywords: ["stove", "gas stove", "induction", "cooking", "outdoor kitchen", "hob"] },
  microwave: { Icon: Microwave, label: "Microwave", group: "Kitchen", keywords: ["microwave", "oven"] },
  refrigerator: { Icon: Refrigerator, label: "Refrigerator", group: "Kitchen", keywords: ["refrigerator", "fridge", "mini bar", "minibar"] },
  "utensils-crossed": { Icon: UtensilsCrossed, label: "Kitchen / utensils", group: "Kitchen", keywords: ["kitchen", "utensils", "cutlery", "crockery", "dining"] },
  "chef-hat": { Icon: ChefHat, label: "Chef / cook", group: "Kitchen", keywords: ["chef", "cook", "private chef", "catering"] },
  coffee: { Icon: Coffee, label: "Tea / coffee", group: "Kitchen", keywords: ["coffee", "tea", "kettle", "coffee maker", "espresso"] },
  croissant: { Icon: Croissant, label: "Breakfast", group: "Kitchen", keywords: ["breakfast", "brunch", "bakery"] },
  salad: { Icon: Salad, label: "Meals", group: "Kitchen", keywords: ["meals", "lunch", "dinner", "food", "vegetarian"] },
  "hand-platter": { Icon: HandPlatter, label: "Room service", group: "Kitchen", keywords: ["room service", "service", "butler", "housekeeping"] },
  "glass-water": { Icon: GlassWater, label: "Drinking water", group: "Kitchen", keywords: ["drinking water", "water", "purifier", "ro"] },
  beer: { Icon: Beer, label: "Bar / drinks", group: "Kitchen", keywords: ["bar", "alcohol", "drinks", "beer", "pub"] },

  // ── Bathroom ──
  bath: { Icon: Bath, label: "Bathroom", group: "Bathroom", keywords: ["bathroom", "bathtub", "washroom", "ensuite"] },
  "shower-head": { Icon: ShowerHead, label: "Shower", group: "Bathroom", keywords: ["shower", "outdoor shower", "rain shower"] },
  toilet: { Icon: Toilet, label: "Toilet", group: "Bathroom", keywords: ["toilet", "wc", "restroom"] },
  droplets: { Icon: Droplets, label: "Hot water", group: "Bathroom", keywords: ["hot water", "geyser", "wash basin", "sink", "basin"] },
  bandage: { Icon: Bandage, label: "Toiletries / first aid", group: "Bathroom", keywords: ["toiletries", "first aid", "first aid kit", "amenities kit"] },
  "washing-machine": { Icon: WashingMachine, label: "Laundry", group: "Bathroom", keywords: ["laundry", "washing machine", "dryer", "iron"] },

  // ── Connectivity & entertainment ──
  wifi: { Icon: Wifi, label: "Wi-Fi", group: "Connectivity", keywords: ["wi-fi", "wifi", "internet", "broadband", "network"] },
  tv: { Icon: Tv2, label: "TV", group: "Connectivity", keywords: ["tv", "television", "entertainment", "netflix", "smart tv"] },
  speaker: { Icon: Speaker, label: "Speaker", group: "Connectivity", keywords: ["speaker", "sound system", "bluetooth"] },
  headphones: { Icon: Headphones, label: "Audio", group: "Connectivity", keywords: ["audio", "headphones", "headset"] },
  music: { Icon: Music, label: "Music", group: "Connectivity", keywords: ["music", "dj", "live music"] },
  guitar: { Icon: Guitar, label: "Instruments", group: "Connectivity", keywords: ["guitar", "instrument", "band"] },
  "gamepad-2": { Icon: Gamepad2, label: "Games", group: "Connectivity", keywords: ["games", "gaming", "console", "board games", "playstation"] },
  popcorn: { Icon: Popcorn, label: "Movies", group: "Connectivity", keywords: ["movie", "cinema", "projector", "screening"] },
  phone: { Icon: Phone, label: "Phone", group: "Connectivity", keywords: ["phone", "telephone", "intercom"] },
  printer: { Icon: Printer, label: "Printer / work", group: "Connectivity", keywords: ["printer", "scanner", "office"] },

  // ── Power ──
  cable: { Icon: Cable, label: "Charging points", group: "Power", keywords: ["charging", "charging points", "usb", "socket"] },
  plug: { Icon: Plug, label: "Power outlet", group: "Power", keywords: ["power", "outlet", "electricity", "plug", "inverter"] },
  zap: { Icon: Zap, label: "Generator", group: "Power", keywords: ["generator", "genset"] },
  "battery-charging": { Icon: BatteryCharging, label: "Power backup", group: "Power", keywords: ["power backup", "battery", "ups"] },
  sun: { Icon: Sun, label: "Solar / sun deck", group: "Power", keywords: ["solar", "sun", "rooftop terrace", "sun deck", "terrace"] },
  lightbulb: { Icon: Lightbulb, label: "Lighting", group: "Power", keywords: ["lighting", "lights", "exterior lights", "lamp"] },
  fuel: { Icon: Fuel, label: "Fuel", group: "Power", keywords: ["fuel", "petrol", "diesel", "gas"] },

  // ── Safety & security ──
  "fire-extinguisher": { Icon: FireExtinguisher, label: "Fire extinguisher", group: "Safety", keywords: ["fire extinguisher", "fire safety"] },
  cctv: { Icon: Cctv, label: "CCTV", group: "Safety", keywords: ["cctv", "surveillance", "camera security"] },
  lock: { Icon: Lock, label: "Safe / secure", group: "Safety", keywords: ["safe", "locker", "security", "secure", "gated"] },
  "locate-fixed": { Icon: LocateFixed, label: "GPS tracking", group: "Safety", keywords: ["gps", "tracking", "navigation"] },
  "life-buoy": { Icon: LifeBuoy, label: "Safety equipment", group: "Safety", keywords: ["safety", "life jacket", "rescue", "helmet", "harness"] },
  "heart-pulse": { Icon: HeartPulse, label: "Medical support", group: "Safety", keywords: ["medical", "doctor", "ambulance", "emergency"] },
  key: { Icon: Key, label: "Self check-in", group: "Safety", keywords: ["check-in", "self check-in", "keyless", "key"] },
  "cigarette-off": { Icon: CigaretteOff, label: "No smoking", group: "Safety", keywords: ["no smoking", "smoking", "non-smoking"] },

  // ── Outdoor & nature ──
  umbrella: { Icon: Umbrella, label: "Awning / shade", group: "Outdoor", keywords: ["awning", "shade", "umbrella", "canopy", "gazebo"] },
  tent: { Icon: Tent, label: "Camping", group: "Outdoor", keywords: ["camping", "tent", "glamping", "campsite"] },
  trees: { Icon: Trees, label: "Garden / forest", group: "Outdoor", keywords: ["garden", "forest", "trees", "lawn", "orchard"] },
  shrub: { Icon: Shrub, label: "Nature", group: "Outdoor", keywords: ["nature", "plants", "greenery"] },
  "flower-2": { Icon: Flower2, label: "Flowers", group: "Outdoor", keywords: ["flowers", "floral", "spa", "wellness"] },
  mountain: { Icon: Mountain, label: "Mountain view", group: "Outdoor", keywords: ["mountain", "hill", "trekking", "hiking", "valley", "view"] },
  waves: { Icon: Waves, label: "Water / pool", group: "Outdoor", keywords: ["pool", "swimming", "beach", "lake", "river", "sea", "water sports"] },
  sunrise: { Icon: Sunrise, label: "Sunrise view", group: "Outdoor", keywords: ["sunrise", "sunset", "scenic"] },
  leaf: { Icon: Leaf, label: "Eco friendly", group: "Outdoor", keywords: ["eco", "sustainable", "green", "organic"] },
  anchor: { Icon: Anchor, label: "Boating", group: "Outdoor", keywords: ["boat", "boating", "kayak", "sailing", "dock"] },
  ship: { Icon: Ship, label: "Cruise", group: "Outdoor", keywords: ["cruise", "ferry", "houseboat", "yacht"] },
  binoculars: { Icon: Binoculars, label: "Sightseeing", group: "Outdoor", keywords: ["sightseeing", "safari", "wildlife", "bird watching", "tour"] },

  // ── Activity ──
  footprints: { Icon: Footprints, label: "Walking / trekking", group: "Activity", keywords: ["walk", "trek", "trail", "hike", "nature walk"] },
  bike: { Icon: Bike, label: "Cycling", group: "Activity", keywords: ["bike", "cycle", "cycling", "bike rack", "bicycle"] },
  dumbbell: { Icon: Dumbbell, label: "Gym / fitness", group: "Activity", keywords: ["gym", "fitness", "workout", "yoga"] },
  trophy: { Icon: Trophy, label: "Sports", group: "Activity", keywords: ["sports", "tournament", "competition", "game"] },
  route: { Icon: Route, label: "Route / itinerary", group: "Activity", keywords: ["route", "itinerary", "road trip", "journey", "distance"] },
  ticket: { Icon: Ticket, label: "Tickets", group: "Activity", keywords: ["ticket", "entry", "pass", "admission"] },
  landmark: { Icon: Landmark, label: "Heritage", group: "Activity", keywords: ["heritage", "monument", "temple", "museum", "historic"] },
  "map-pin": { Icon: MapPin, label: "Location", group: "Activity", keywords: ["location", "place", "address", "pickup", "drop"] },
  camera: { Icon: Camera, label: "Photography", group: "Activity", keywords: ["photo", "photography", "video shoot", "camera"] },
  hammer: { Icon: Hammer, label: "Workshop", group: "Activity", keywords: ["workshop", "craft", "pottery", "diy"] },
  backpack: { Icon: Backpack, label: "Gear included", group: "Activity", keywords: ["gear", "equipment", "equipments", "backpack", "kit"] },
  clock: { Icon: Clock, label: "Duration", group: "Activity", keywords: ["duration", "hours", "time", "24/7", "flexible timing"] },

  // ── Access & guests ──
  accessibility: { Icon: Accessibility, label: "Wheelchair accessible", group: "Access", keywords: ["wheelchair", "accessible", "disabled", "step-free"] },
  "paw-print": { Icon: PawPrint, label: "Pet friendly", group: "Access", keywords: ["pet", "pets", "pet friendly", "dog friendly"] },
  dog: { Icon: Dog, label: "Pets on site", group: "Access", keywords: ["dog", "animals", "farm animals"] },
  baby: { Icon: Baby, label: "Family / kids", group: "Access", keywords: ["kids", "children", "family", "baby", "crib", "child"] },
  users: { Icon: Users, label: "Groups", group: "Access", keywords: ["group", "groups", "couples", "large group", "capacity"] },
  heart: { Icon: Heart, label: "Couples / romantic", group: "Access", keywords: ["romantic", "couple", "honeymoon"] },
  "door-open": { Icon: DoorOpen, label: "Private entrance", group: "Access", keywords: ["private entrance", "entrance", "access", "private"] },
  "car-front": { Icon: CarFront, label: "Parking", group: "Access", keywords: ["parking", "car", "garage", "valet", "driver"] },
  luggage: { Icon: Luggage, label: "Luggage storage", group: "Access", keywords: ["luggage", "baggage", "storage room"] },

  /* ── Stays & vehicles ──
     These are the `type: "category"` rows — the property-type and caravan-type
     pickers. They're the largest block of names in the CMS and none of them
     matched anything until this group existed. */
  house: { Icon: House, label: "House / cottage", group: "Stays", keywords: ["cottage", "homestay", "holiday home", "guest house", "cabin", "log house", "farm stay", "standard stay", "house", "home", "stay", "bungalow"] },
  castle: { Icon: Castle, label: "Palace / heritage", group: "Stays", keywords: ["palace", "haveli", "fort", "mansion"] },
  hotel: { Icon: Hotel, label: "Resort / hotel", group: "Stays", keywords: ["resort", "hotel", "hostel", "boutique stay", "luxury stay", "popular stay", "unique stay", "villa", "apartment", "suite"] },
  "tree-pine": { Icon: TreePine, label: "Treehouse", group: "Stays", keywords: ["treehouse", "tree house"] },
  "building-2": { Icon: Building2, label: "Building", group: "Stays", keywords: ["building", "property", "complex", "tower"] },
  warehouse: { Icon: Warehouse, label: "Barn / shed", group: "Stays", keywords: ["barn", "shed", "warehouse", "a frame", "dome", "cave house", "yurt", "igloo"] },
  caravan: { Icon: Caravan, label: "Caravan / motorhome", group: "Stays", keywords: ["caravan", "campervan", "camper van", "motorhome", "rv", "camper trailer", "travel trailer", "off road caravan", "mini caravan", "camper"] },
  truck: { Icon: Truck, label: "Van", group: "Stays", keywords: ["cargo van", "panel van", "van", "truck", "lorry"] },
  bus: { Icon: Bus, label: "Coach / transport", group: "Stays", keywords: ["bus", "coach", "shuttle", "transport", "transfer"] },

  // ── Guiding & misc activity ──
  compass: { Icon: Compass, label: "Guide", group: "Activity", keywords: ["guide", "expert guide", "instructor", "escort", "navigation aid"] },
  fish: { Icon: Fish, label: "Fishing", group: "Activity", keywords: ["fishing", "angling", "fish"] },

  // ── Catch-all ──
  sparkles: { Icon: Sparkles, label: "General", group: "Other", keywords: ["other", "general", "misc", "extra"] },
};

export const ICON_NAMES = Object.keys(ICON_LIBRARY);

/** Groups in display order for the picker. */
export const ICON_GROUPS = [...new Set(ICON_NAMES.map((n) => ICON_LIBRARY[n].group))];

const normalise = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[_/.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Crude singulariser, applied per word.
 *
 * Needed because the CMS names categories in the plural — "Cottages",
 * "Houseboats", "Villas", "Treehouses", "Tents", "Farm Stays" — while keywords
 * read naturally in the singular. Without this, every one of those fell through
 * to the neutral mark. Only the endings that actually occur in the data are
 * handled; this isn't trying to be a stemmer.
 */
const singularise = (s: string) =>
  s
    .split(" ")
    .map((w) => {
      if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
      if (w.length > 4 && (w.endsWith("ses") || w.endsWith("xes") || w.endsWith("ches")))
        return w.slice(0, -2);
      if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
      return w;
    })
    .join(" ");

/**
 * Best icon for a feature *name*.
 *
 * Exact keyword hit wins outright. Otherwise a whole-word match, ranked by
 * keyword length so "outdoor kitchen" picks the stove rather than settling for
 * a bare "outdoor". Ties break on position: the earlier word in the name is the
 * more specific one — "Solar Power" matches both `solar` and `power` at five
 * characters each, and it should be a sun, not a plug.
 *
 * Returns `null` when nothing is close, which the renderer turns into
 * `Sparkles`. Guessing wildly is worse than a neutral mark.
 */
export function inferIconName(featureName: string): string | null {
  const name = normalise(featureName);
  if (!name) return null;
  // Both forms are tested, so "Cottages" hits the "cottage" keyword.
  const singular = singularise(name);

  let best: { icon: string; score: number; at: number } | null = null;

  for (const iconName of ICON_NAMES) {
    for (const keyword of ICON_LIBRARY[iconName].keywords) {
      const k = normalise(keyword);
      if (name === k || singular === k) return iconName; // exact — can't be beaten

      // Whole-word containment, so "car" never fires on "caravan".
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const boundary = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
      const hit =
        boundary.test(name) || boundary.test(singular) || (k.length > 4 && k.includes(singular));
      if (!hit) continue;

      const at = Math.max(name.indexOf(k), singular.indexOf(k));
      const better =
        !best || k.length > best.score || (k.length === best.score && at >= 0 && at < best.at);
      if (better) best = { icon: iconName, score: k.length, at: at < 0 ? Number.MAX_SAFE_INTEGER : at };
    }
  }

  return best?.icon ?? null;
}

/** True when the stored value is a library token rather than an upload path. */
export const isLucideIcon = (icon?: string): boolean => !!icon?.startsWith(LUCIDE_PREFIX);

/** `lucide:wifi` → the component, or undefined for an unknown/renamed token. */
export function lucideComponentFor(icon?: string): IconComponent | undefined {
  if (!isLucideIcon(icon)) return undefined;
  return ICON_LIBRARY[icon!.slice(LUCIDE_PREFIX.length)]?.Icon;
}

/**
 * The single renderer. Resolution order is documented at the top of this file.
 *
 * `name` is what makes iconless features look finished — without it this would
 * render an empty box for every row currently in the database.
 */
export const FeatureIcon = ({
  icon,
  name,
  size = 17,
  className,
}: {
  icon?: string;
  name?: string;
  size?: number;
  className?: string;
}) => {
  // 1. Explicitly picked from the library.
  const picked = lucideComponentFor(icon);
  if (picked) {
    const Picked = picked;
    return <Picked size={size} className={className} />;
  }

  // 2. An uploaded image. `img` can still 404; `FeatureImage` falls back to the
  //    inferred glyph rather than the browser's broken-image marker.
  if (icon && !isLucideIcon(icon)) {
    return <FeatureImage src={icon} name={name} size={size} className={className} />;
  }

  // 3 & 4. Inferred from the name, else the neutral mark.
  const Inferred = ICON_LIBRARY[inferIconName(name || "") || "sparkles"].Icon;
  return <Inferred size={size} className={className} />;
};

/** Uploaded icon with a graceful degrade to the inferred glyph. */
const FeatureImage = ({
  src,
  name,
  size,
  className,
}: {
  src: string;
  name?: string;
  size: number;
  className?: string;
}) => {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    const Inferred = ICON_LIBRARY[inferIconName(name || "") || "sparkles"].Icon;
    return <Inferred size={size} className={className} />;
  }

  return (
    <img
      src={getImageUrl(src)}
      alt=""
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={cn("object-contain", className)}
    />
  );
};
