import React, { useEffect, useState } from "react";
import { Plus, Award, MapPinOff } from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Navigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardHeader } from "@/components/Header";
import { offersApi, type OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CustomPagination } from "@/components/CustomPagination";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { OfferingCard, OfferPanel } from "@/components/offering";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";

const ITEMS_PER_PAGE = 12;

const Offering = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as "approved" | "pending") || "approved";
  const [activeTab, setActiveTab] = useState<"approved" | "pending">(initialTab);
  const [page, setPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [approvedOffers, setApprovedOffers] = useState<OfferDTO[]>([]);
  const [pendingOffers, setPendingOffers] = useState<OfferDTO[]>([]);

  // Panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<OfferDTO | null>(null);

  useEffect(() => { setPage(1); }, [activeTab]);

  const token = localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token") || undefined;

  const reload = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [approved, pending] = await Promise.all([
        offersApi.list("approved", token, { mine: true }),
        offersApi.list("pending", token, { mine: true }),
      ]);
      setApprovedOffers(Array.isArray(approved.data) ? approved.data : []);
      setPendingOffers(Array.isArray(pending.data) ? pending.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    reload();
    const id = setInterval(reload, 100000);
    return () => clearInterval(id);
  }, [user?.id]);

  const offers = activeTab === "approved" ? approvedOffers : pendingOffers;
  const totalPages = Math.ceil(offers.length / ITEMS_PER_PAGE);
  const paginated = offers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const onDelete = async (id: string) => { await offersApi.remove(id, token); reload(); setShowDropdown(null); };
  const onEdit = (offer: OfferDTO) => { setEditing(offer); setPanelOpen(true); };
  const onSaved = () => { reload(); setPanelOpen(false); };

  const tabs: { key: "approved" | "pending"; label: string; count: number }[] = [
    { key: "approved", label: "Approved", count: approvedOffers.length },
    { key: "pending", label: "Pending", count: pendingOffers.length },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-plus-jakarta overflow-hidden">
      <div className="hidden lg:block flex-shrink-0"><Sidebar /></div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Offerings" />

        <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-5">

          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between pb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div style={{ width: 20, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GRAY_400 }}>Manage</span>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, backgroundColor: SURFACE, borderRadius: 12, padding: 3 }}>
                {tabs.map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                        borderRadius: 9, border: `1.5px solid ${active ? `${TEAL}30` : "transparent"}`,
                        backgroundColor: active ? WHITE : "transparent",
                        color: active ? TEAL : GRAY_400,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                      }}>
                      {tab.label}
                      {tab.count > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, minWidth: 20, textAlign: "center",
                          backgroundColor: active ? TEAL : GRAY_200,
                          color: active ? BLACK : GRAY_400,
                        }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="button" onClick={() => navigate("/offering/add")}
              style={{
                display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px",
                borderRadius: 13, border: "none", backgroundColor: TEAL,
                fontSize: 13, fontWeight: 700, color: BLACK, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(7,228,228,0.3)", transition: "all 0.15s",
              }}>
              <Plus size={16} strokeWidth={2.5} /> Add Offering
            </button>
          </div>

          {/* ── Grid ── */}
          <div className="flex-1 overflow-y-auto scrollbar-hide" onClick={() => setShowDropdown(null)}>
            {loading ? (
              <UniqueStaysSkeleton />
            ) : offers.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
                <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: TEAL_BG, border: "1.5px solid rgba(7,228,228,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Award size={32} color={TEAL} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: BLACK, marginBottom: 8 }}>
                  {activeTab === "approved" ? "No approved offerings yet" : "No pending offerings"}
                </h3>
                <p style={{ fontSize: 13, color: GRAY_400, maxWidth: 320, marginBottom: 20, lineHeight: 1.6 }}>
                  {activeTab === "approved"
                    ? "Once the admin approves your submitted offerings, they'll appear here."
                    : "Offerings you create go into pending review first. Create one to get started."}
                </p>
                {activeTab === "approved" ? (
                  <button type="button" onClick={() => setActiveTab("pending")} style={{ fontSize: 13, fontWeight: 700, color: TEAL, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                    View pending offerings →
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate("/offering/add")}
                    style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 22px", borderRadius: 13, border: "none", backgroundColor: TEAL, fontSize: 13, fontWeight: 700, color: BLACK, cursor: "pointer", boxShadow: "0 4px 16px rgba(7,228,228,0.3)" }}>
                    <Plus size={15} /> Create your first offering
                  </button>
                )}
              </div>
            ) : (
              <>
                <div key={activeTab} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                  {paginated.map((listing) => (
                    <OfferingCard
                      key={listing._id}
                      listing={listing}
                      showDropdown={showDropdown}
                      onToggleDropdown={(id) => setShowDropdown(showDropdown === id ? null : id)}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onCardClick={(id) => navigate(`/offering/${id}`)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <CustomPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit panel */}
      <OfferPanel open={panelOpen} initial={editing} onOpenChange={setPanelOpen} onSaved={onSaved} />
    </div>
  );
};

export default Offering;
