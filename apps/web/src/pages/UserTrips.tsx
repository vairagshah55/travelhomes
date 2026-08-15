/**
 * /user-trips — the traveller's own bookings.
 *
 * The page has one job: make the next trip unmistakable and everything else
 * scannable. Time is the organising principle, because time is what someone
 * opens this page to check. The nearest upcoming trip gets the pass treatment
 * at the top of the Upcoming tab; every other trip is a card carrying its own
 * day-distance.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, MapPinned, SlidersHorizontal, Trash2 } from "lucide-react";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import FilterModal from "../components/FilterModal";
import MobileUserNav from "../components/MobileUserNav";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { bookingsApi, BookingDTO } from "../lib/api";
import { CustomPagination } from "@/components/CustomPagination";

import { NextTripPass, TripCard, TripCardSkeleton } from "@/components/trips/TripCard";
import {
  CancelTripModal,
  InvoiceModal,
  ReviewTripModal,
  TripDetailsModal,
} from "@/components/trips/TripModals";
import { daysUntil, isPastStatus } from "@/components/trips/tripHelpers";

type TabKey = "upcoming" | "previous" | "manage";

const ITEMS_PER_PAGE = 12;

/** Which dialog is open, if any. One value beats four booleans that can disagree. */
type OpenModal = "cancel" | "details" | "review" | "invoice" | null;

const UserTrips = () => {
  const { user, token: authToken } = useAuth();
  const token = authToken ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [selectedTrip, setSelectedTrip] = useState<BookingDTO | null>(null);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [page, setPage] = useState(1);

  const uid = user?.id || (user as any)?._id;
  const tripsKey = ["bookings", "userTrips", uid] as const;

  // useQuery handles loading state, dedups in-flight requests, and caches
  // across navigation. The legacy version refetched on every component
  // mount (e.g. after navigating into trip details and back).
  const { data: allBookings = [], isLoading: loading } = useQuery<BookingDTO[]>({
    queryKey: tripsKey,
    enabled: !!uid,
    queryFn: async () => {
      const res = await bookingsApi.getUserBookings(uid, token);
      if (res.success) return res.bookings;
      toast.error("Couldn't load your trips. Pull down to try again.");
      throw new Error("getUserBookings: success=false");
    },
  });

  useEffect(() => {
    setPage(1);
    if (activeTab !== "manage") setSelectedTrips([]);
  }, [activeTab]);

  /* ── Buckets ──────────────────────────────────────────────────────────── */
  const { upcoming, previous } = useMemo(() => {
    const up: BookingDTO[] = [];
    const past: BookingDTO[] = [];
    for (const b of allBookings) (isPastStatus(b.bookingStatus) ? past : up).push(b);

    // Soonest first for upcoming, most recent first for past — in both cases
    // the trip you care about is the one nearest to now.
    up.sort((a, b) => daysUntil(a.checkInDate) - daysUntil(b.checkInDate));
    past.sort((a, b) => new Date(b.checkOutDate).getTime() - new Date(a.checkOutDate).getTime());
    return { upcoming: up, previous: past };
  }, [allBookings]);

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "previous", label: "Past", count: previous.length },
    { key: "manage", label: "Manage", count: allBookings.length },
  ];

  const currentTrips =
    activeTab === "upcoming" ? upcoming : activeTab === "previous" ? previous : allBookings;

  // The nearest confirmed-ish trip is promoted out of the grid and into the
  // pass. Only on page 1 — on page 3 of your history it would be a lie.
  const featured =
    activeTab === "upcoming" && page === 1 && currentTrips.length > 0 ? currentTrips[0] : null;
  const gridSource = featured ? currentTrips.slice(1) : currentTrips;

  const totalPages = Math.ceil(gridSource.length / ITEMS_PER_PAGE);
  const paginatedTrips = gridSource.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* ── Actions ──────────────────────────────────────────────────────────── */
  const openWith = (modal: OpenModal) => (trip: BookingDTO) => {
    setSelectedTrip(trip);
    setOpenModal(modal);
  };

  const tripActions = {
    onCancel: openWith("cancel"),
    onView: openWith("details"),
    onReview: openWith("review"),
    onGetInvoice: openWith("invoice"),
  };

  const closeModal = () => setOpenModal(null);

  const confirmCancellation = async () => {
    if (!selectedTrip) return;
    setCancelling(true);
    try {
      const res = await bookingsApi.updateStatus(selectedTrip._id, "cancelled", token);
      if (!res.success) throw new Error("updateStatus: success=false");
      queryClient.setQueryData<BookingDTO[]>(tripsKey, (prev) =>
        (prev ?? []).map((b) =>
          b._id === selectedTrip._id ? { ...b, bookingStatus: "cancelled" } : b,
        ),
      );
      closeModal();
      toast.success("Trip cancelled. Your refund is on its way.");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Couldn't cancel the trip. Try again in a moment.");
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTrips.length === 0) return;
    const count = selectedTrips.length;
    if (
      !window.confirm(
        `Remove ${count} ${count === 1 ? "trip" : "trips"} from your history? This can't be undone.`,
      )
    ) {
      return;
    }

    try {
      await Promise.all(selectedTrips.map((id) => bookingsApi.delete(id, token)));
      // Drop deleted rows from the cache rather than refetching the
      // whole list — the deleteMany endpoint is best-effort.
      queryClient.setQueryData<BookingDTO[]>(tripsKey, (prev) =>
        (prev ?? []).filter((b) => !selectedTrips.includes(b._id)),
      );
      setSelectedTrips([]);
      toast.success(`${count} ${count === 1 ? "trip" : "trips"} removed.`);
    } catch (error) {
      console.error("Error deleting trips:", error);
      toast.error("Couldn't remove some trips. Try again in a moment.");
    }
  };

  const toggleTripSelection = (id: string) =>
    setSelectedTrips((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id],
    );

  const guestName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  /* ── Empty states — an invitation, not a shrug ────────────────────────── */
  const EMPTY_COPY: Record<TabKey, { title: string; body: string; cta: string | null }> = {
    upcoming: {
      title: "Nothing booked yet",
      body: "Your next trip will show up here the moment you book it, with a countdown to check-in.",
      cta: "Find a stay",
    },
    previous: {
      title: "No past trips",
      body: "Once you've checked out, your trip moves here with its invoice and a place to leave a review.",
      cta: "Find a stay",
    },
    manage: {
      title: "No trips to manage",
      body: "This is where you'll tidy up your history once you have a few trips behind you.",
      cta: null,
    },
  };

  const empty = EMPTY_COPY[activeTab];
  const showEmpty = !loading && currentTrips.length === 0;

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="flex min-h-screen flex-col bg-th-surface-1 text-th-text-primary">
      <SiteHeader />

      <main className="mt-20 flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="mb-2 inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-th-text-muted transition-colors hover:text-th-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-border-focus"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="text-3xl font-semibold tracking-[-0.025em] text-th-text-primary sm:text-4xl">
                Trips
              </h1>
              {!loading && allBookings.length > 0 && (
                <p className="mt-1.5 text-[13.5px] tabular-nums text-th-text-muted">
                  {upcoming.length} upcoming · {previous.length} past
                </p>
              )}
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex w-fit items-center gap-2 rounded-th-full border border-th-border bg-th-surface-raised px-4 py-2.5 text-[13px] font-semibold text-th-text-primary transition-colors hover:border-th-border-hover hover:bg-th-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-border-focus"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Tabs — counts are real quantities, so they belong on the control. */}
          <div
            role="tablist"
            aria-label="Trip status"
            className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:mb-8 sm:px-0"
          >
            <div className="inline-flex items-center gap-1 rounded-th-full border border-th-border bg-th-surface-raised p-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-th-full px-4 py-2 text-[13.5px] font-semibold transition-colors duration-th-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-border-focus sm:px-5 ${
                      active ? "text-th-brand-fg" : "text-th-text-muted hover:text-th-text-primary"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="tripsTabPill"
                        className="absolute inset-0 rounded-th-full bg-th-brand"
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 34 }
                        }
                      />
                    )}
                    <span className="relative">{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`relative text-[12px] tabular-nums ${
                          active ? "opacity-75" : "opacity-60"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection bar — only where selecting is possible. */}
          {activeTab === "manage" && !showEmpty && (
            <div className="mb-6 flex flex-col gap-3 rounded-th-2xl border border-th-border bg-th-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13.5px] text-th-text-secondary">
                {selectedTrips.length === 0 ? (
                  "Select trips to remove them from your history."
                ) : (
                  <>
                    <span className="font-semibold tabular-nums text-th-text-primary">
                      {selectedTrips.length}
                    </span>{" "}
                    selected
                  </>
                )}
              </p>
              <Button
                onClick={handleDeleteSelected}
                disabled={selectedTrips.length === 0}
                size="sm"
                className="w-full gap-2 rounded-th-full bg-th-error text-white hover:opacity-90 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Remove selected
              </Button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TripCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <div className="rounded-th-2xl border border-dashed border-th-border bg-th-surface-raised px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-th-full bg-th-info-bg">
                <MapPinned className="h-6 w-6 text-th-info" />
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.015em] text-th-text-primary">
                {empty.title}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-th-text-muted">
                {empty.body}
              </p>
              {empty.cta && (
                <Button
                  onClick={() => navigate("/")}
                  className="mt-6 rounded-th-full bg-th-brand px-6 text-th-brand-fg hover:bg-th-brand-hover"
                >
                  {empty.cta}
                </Button>
              )}
            </div>
          ) : (
            <motion.div {...fade} className="space-y-6">
              {featured && <NextTripPass trip={featured} actions={tripActions} />}

              {paginatedTrips.length > 0 && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedTrips.map((trip) => (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      isPrevious={
                        activeTab === "previous" ||
                        (activeTab === "manage" && isPastStatus(trip.bookingStatus))
                      }
                      actions={tripActions}
                      selectable={activeTab === "manage"}
                      selected={selectedTrips.includes(trip._id)}
                      onSelect={() => toggleTripSelection(trip._id)}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Clearance for the fixed bottom nav, painted in the footer's own
          colour so the page doesn't end on a white band. Collapses to 0 at lg,
          where the nav is hidden. Matches Wishlist.tsx's pattern. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />

      <MobileUserNav />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => setIsFilterOpen(false)}
      />

      {selectedTrip && openModal === "cancel" && (
        <CancelTripModal
          trip={selectedTrip}
          onClose={closeModal}
          onConfirm={confirmCancellation}
          busy={cancelling}
        />
      )}
      {selectedTrip && openModal === "details" && (
        <TripDetailsModal
          trip={selectedTrip}
          onClose={closeModal}
          guestName={guestName}
          guestEmail={user?.email}
        />
      )}
      {selectedTrip && openModal === "review" && (
        <ReviewTripModal
          trip={selectedTrip}
          onClose={closeModal}
          reviewerName={guestName}
          reviewerEmail={user?.email}
          reviewerAvatar={(user as any)?.photo}
        />
      )}
      {selectedTrip && openModal === "invoice" && (
        <InvoiceModal
          trip={selectedTrip}
          onClose={closeModal}
          guestName={guestName}
          guestEmail={user?.email}
        />
      )}
    </div>
  );
};

export default UserTrips;
