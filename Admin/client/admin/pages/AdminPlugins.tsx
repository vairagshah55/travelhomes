import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { pluginsApi, type PluginDto } from "@/services/plugins";

interface LicenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin?: PluginDto | null;
  onSubmit: (id: string, licenseKey: string) => Promise<void>;
}

const LicenseDetailsModal: React.FC<LicenseDetailsModalProps> = ({
  isOpen,
  onClose,
  plugin,
  onSubmit,
}) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLicenseKey(plugin?.licenseKey || "");
  }, [plugin]);

  const handleSubmit = async () => {
    if (!plugin?._id) return;
    try {
      setSaving(true);
      await onSubmit(plugin._id, licenseKey);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[618px] p-0 bg-white rounded-xl overflow-hidden">
        <div className="flex flex-col gap-2.5 p-6 pb-4">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-[#131313] leading-8 tracking-[-0.48px]">
                    License Details{plugin?.vendorName ? ` — ${plugin.vendorName}` : ""}
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-start gap-2.5">
                      <span className="text-base text-[#334054] font-normal">Enter Key</span>
                    </div>
                    <div className="flex flex-col items-start gap-3 h-[38px] w-full">
                      <Input
                        placeholder="Type here"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        className="flex-1 h-[38px] px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="h-px w-full bg-[#EBEBEB]"></div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="h-12 px-8 bg-[#131313] text-white rounded-[60px] text-base font-medium leading-[19.2px] tracking-[-0.32px] hover:bg-[#2a2a2a]"
              >
                {saving ? "Saving..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DEFAULT_PLUGINS = [
  "Live Chat",
  "Google Recaptcha",
  "Payment Gateway",
  "Text Message",
  "Whatsapp",
  "Email",
];

const AdminPlugins: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plugins, setPlugins] = useState<PluginDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlugin, setSelectedPlugin] = useState<PluginDto | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Fetch plugins; seed if empty
  const load = async (q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const list = await pluginsApi.list(q);
      
      // If no plugins exist and we're not searching, seed the defaults
      if (!q && (!list || list.length === 0)) {
        console.log("Seeding default plugins...");
        for (const name of DEFAULT_PLUGINS) {
          try {
            await pluginsApi.create({ vendorName: name, enabled: false });
          } catch (e) {
            console.error(`Failed to seed plugin ${name}:`, e);
          }
        }
        // Fetch the list again after seeding
        const seededList = await pluginsApi.list();
        setPlugins(seededList);
      } else {
        setPlugins(list || []);
      }
    } catch (e: any) {
      console.error("Error loading plugins:", e);
      setError(
        typeof e?.message === "string"
          ? e.message
          : "Failed to load plugins. Make sure server is running and database is reachable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load and debounced search
    const id = setTimeout(() => {
      load(searchTerm || undefined);
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleTogglePlugin = async (plugin: PluginDto) => {
    try {
      // optimistic update
      setPlugins((prev) => prev.map((p) => (p._id === plugin._id ? { ...p, enabled: !p.enabled } : p)));
      
      const updated = await pluginsApi.toggle(plugin._id);
      const data = (updated as any)?.data || updated;
      
      if (data?._id) {
        setPlugins((prev) => prev.map((p) => (p._id === data._id ? data : p)));
        toast.success(`${plugin.vendorName} ${data.enabled ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (e) {
      // revert on error
      setPlugins((prev) => prev.map((p) => (p._id === plugin._id ? { ...p, enabled: plugin.enabled } : p)));
      toast.error("Failed to toggle plugin. Ensure server is running and database is reachable.");
    }
  };

  const handleOpenLicense = (plugin: PluginDto) => {
    setSelectedPlugin(plugin);
    setIsLicenseModalOpen(true);
  };

  const handleSubmitLicense = async (id: string, licenseKey: string) => {
    try {
      const res = await pluginsApi.setLicense(id, licenseKey);
      const data = (res as any)?.data || res;
      setPlugins((prev) => prev.map((p) => (p._id === id ? { ...p, licenseKey: data?.licenseKey ?? licenseKey } : p)));
      toast.success("License details updated successfully");
    } catch (e) {
      toast.error("Failed to save license. Ensure server is running and database is reachable.");
    }
  };

  const filteredPlugins = useMemo(() => {
    if (!searchTerm) return plugins;
    const q = searchTerm.toLowerCase();
    return plugins.filter((p) => p.vendorName.toLowerCase().includes(q));
  }, [plugins, searchTerm]);

  const Switch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`flex items-center w-9 h-5 p-0.5 rounded-full transition-colors ${
        checked ? "bg-[#2563EB] justify-end" : "bg-[#D2D5DA] justify-start"
      }`}
    >
      <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <div className="fixed">
        <AdminSidebar showMobileSidebar={mobileOpen} setShowMobileSidebar={setMobileOpen} />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader Headtitle={"PlugIns"} setMobileSidebarOpen={setMobileOpen} />

        {/* Content Body */}
        <div className="flex-1 p-5 space-y-8">
          {/* Search Section */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative w-[255px] h-10">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#485467] h-5 w-5" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-[#B0B0B0] rounded-lg text-[#2E2E2E] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#EAECF0] bg-white overflow-hidden overflow-x-auto">
            {/* Table Header */}
            <div className="flex items-center w-full bg-[#F2F4F7]">
              <div className="flex max-md:mx-5 items-center gap-2.5 px-4 py-3 flex-1">
                <span className="text-sm font-bold text-[#334054] leading-[21px]">Vendor Name</span>
              </div>
              <div className="flex max-md:mx-5 items-center gap-2.5 px-3 py-3 flex-1">
                <span className="text-sm font-bold text-[#334054] leading-[21px]">Status</span>
              </div>
              <div className="flex max-md:mx-5 items-center gap-2.5 px-3 py-3 w-40">
                <span className="text-sm font-bold text-[#334054] leading-[21px]">Action</span>
              </div>
            </div>

            {/* Table Body */}
            <div className="w-full">
              {loading && (
                <div className="p-10 text-center text-sm text-gray-500">
                  <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-[#131313] rounded-full mb-2" role="status" aria-label="loading"></div>
                  <div>Loading plugins...</div>
                </div>
              )}
              {error && (
                <div className="p-10 text-center text-sm text-red-600">
                  <p className="font-semibold mb-1">Error</p>
                  <p>{error}</p>
                </div>
              )}
              {!loading && !error && filteredPlugins.length === 0 && (
                <div className="p-10 text-center text-sm text-gray-500">
                  No plugins found matching your search.
                </div>
              )}
              {!loading && !error && filteredPlugins.map((plugin) => (
                <div key={plugin._id} className="flex items-center w-full border-b border-[#F2F4F7] last:border-b-0 hover:bg-gray-50 transition-colors">
                  <div className="flex max-md:mx-3 items-center gap-2.5 px-4 py-3.5 flex-1">
                    <span className="text-base font-medium text-[#131313] leading-6">{plugin.vendorName}</span>
                  </div>
                  <div className="flex max-md:mx-3 items-center gap-2.5 px-3 py-3 flex-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        plugin.enabled ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${plugin.enabled ? "bg-green-500" : "bg-gray-400"}`}></div>
                      <span
                        className={`text-sm font-medium ${
                          plugin.enabled ? "text-green-700" : "text-gray-600"
                        }`}
                      >
                        {plugin.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <div className="flex max-md:mx-3 items-center gap-2.5 w-40 px-3 py-3">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleOpenLicense(plugin)}
                        title="Configure License"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors text-[#131313]"
                      >
                        <Edit className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                      <Switch checked={!!plugin.enabled} onChange={() => handleTogglePlugin(plugin)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* License Details Modal */}
      <LicenseDetailsModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        plugin={selectedPlugin}
        onSubmit={handleSubmitLicense}
      />
    </div>
  );
};

export default AdminPlugins;
