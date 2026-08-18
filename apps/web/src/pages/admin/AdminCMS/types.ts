/**
 * Shared types used across the AdminCMS page and its tab/modal sub-components.
 *
 * Lifted out of the monolithic AdminCMS.tsx during the split into
 * AdminCMS/{tabs,modals}/. Anything tab-local should NOT live here.
 */

export interface JobPosition {
  id: string;
  position: string;
  experience: string;
  location: string;
  jd: string;
  isActive: boolean;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  userName: string;
  rating: number;
  content: string;
  isActive?: boolean;
}

export interface Feature {
  id: string;
  name: string;
  category: string;
  status: "enable" | "disable";
  icon: string;
  description?: string;
  /** "feature" | "category" | "subcategory". The API returns it on every row;
      it was just never declared here, so the CSV export had to cast to read it. */
  type?: string;
}

export interface StaffRole {
  id: string;
  name: string;
  features: string[];
}

/* ── Modal prop shapes ──────────────────────────────────────── */

export interface AddFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (faqData: any) => void;
  initialData?: FAQ | null;
}

export interface AddFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (featureData: any) => void;
  type?: "feature" | "category" | "subcategory";
  /** Present → the modal is in edit mode and prefills from this row. */
  initialData?: Feature | null;
}

export interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: any) => void;
  initialData?: JobPosition | null;
}
