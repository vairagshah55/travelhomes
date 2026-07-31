import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
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
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="h-12 px-8 rounded-[60px] text-base font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="h-12 px-8 bg-tpl-primary hover:bg-tpl-primary/90 text-black rounded-[60px] text-base font-medium"
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
          : "Failed to load plugins. Make sure server is running and database is reachable.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load and debounced search
    const id = setTimeout(
      () => {
        load(searchTerm || undefined);
      },
      searchTerm ? 400 : 0,
    );
    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleTogglePlugin = async (plugin: PluginDto) => {
    try {
      // optimistic update
      setPlugins((prev) =>
        prev.map((p) => (p._id === plugin._id ? { ...p, enabled: !p.enabled } : p)),
      );

      const updated = await pluginsApi.toggle(plugin._id);
      const data = (updated as any)?.data || updated;

      if (data?._id) {
        setPlugins((prev) => prev.map((p) => (p._id === data._id ? data : p)));
        toast.success(`${plugin.vendorName} ${data.enabled ? "enabled" : "disabled"} successfully`);
      }
    } catch (e) {
      // revert on error
      setPlugins((prev) =>
        prev.map((p) => (p._id === plugin._id ? { ...p, enabled: plugin.enabled } : p)),
      );
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
      setPlugins((prev) =>
        prev.map((p) => (p._id === id ? { ...p, licenseKey: data?.licenseKey ?? licenseKey } : p)),
      );
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

  return (
    <AdminLayout title="Plugins">
      <div className="flex-1 p-5 space-y-8">
        {/* Search Section */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-[255px] h-10">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#485467] h-5 w-5" />
              <Input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 text-sm text-tpl-dark"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col items-center gap-3 bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden overflow-x-auto">
          {/* Table Header — template InvoiceTable style: light-blue tint, text-base bold dark */}
          <div className="flex items-center w-full bg-[#F7F9FC] dark:bg-tpl-dark-2 border-b border-tpl-stroke">
            <div className="flex max-md:mx-5 items-center gap-2.5 px-4 py-4 flex-1">
              <span className="text-base font-bold text-tpl-dark dark:text-white">Vendor Name</span>
            </div>
            <div className="flex max-md:mx-5 items-center gap-2.5 px-3 py-4 flex-1">
              <span className="text-base font-bold text-tpl-dark dark:text-white">Status</span>
            </div>
            <div className="flex max-md:mx-5 items-center gap-2.5 px-3 py-4 w-40">
              <span className="text-base font-bold text-tpl-dark dark:text-white">Action</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="w-full">
            {loading && (
              <div className="p-10 text-center text-sm text-gray-500">
                <div
                  className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-[#131313] rounded-full mb-2"
                  role="status"
                  aria-label="loading"
                ></div>
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
            {!loading &&
              !error &&
              filteredPlugins.map((plugin) => (
                <div
                  key={plugin._id}
                  className="flex items-center w-full border-b border-[#F2F4F7] last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex max-md:mx-3 items-center gap-2.5 px-4 py-3.5 flex-1">
                    <span className="text-base font-medium text-[#131313] leading-6">
                      {plugin.vendorName}
                    </span>
                  </div>
                  <div className="flex max-md:mx-3 items-center gap-2.5 px-3 py-3 flex-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        plugin.enabled ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${plugin.enabled ? "bg-green-500" : "bg-gray-400"}`}
                      ></div>
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
                      <Switch
                        checked={!!plugin.enabled}
                        onCheckedChange={() => handleTogglePlugin(plugin)}
                        aria-label={`${plugin.enabled ? "Disable" : "Enable"} ${plugin.vendorName}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
    </AdminLayout>
  );
};

export default AdminPlugins;
