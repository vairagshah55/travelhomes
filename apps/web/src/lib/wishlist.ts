// Simple wishlist helpers using localStorage

export interface WishlistItem {
  id: string; // unique identifier (can be a route like /unique-stay/:id)
  title: string;
  type: 'campervan' | 'stay' | 'activity';
  location: string;
  price: string; // e.g., "₹2890/night" or "₹2890/person"
  rating?: number;
  image: string;
  dateAdded: string; // ISO string
}

const KEY = 'travel_wishlist';
export const WISHLIST_UPDATED = 'wishlist-updated';

function save(list: WishlistItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(WISHLIST_UPDATED));
  } catch {}
}

export function getWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasWishlistItem(id: string): boolean {
  const list = getWishlist();
  return list.some(i => i.id === id);
}

export function addWishlistItem(item: WishlistItem) {
  const list = getWishlist();
  if (!list.some(i => i.id === item.id)) {
    list.push(item);
    save(list);
  }
}

export function removeWishlistItem(id: string) {
  const list = getWishlist().filter(i => i.id !== id);
  save(list);
}

export function clearWishlist() {
  save([]);
}