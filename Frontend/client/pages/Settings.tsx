import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NotebookPen, Check } from 'lucide-react';
import { Sidebar } from '@/components/Navigation';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { DashboardHeader } from '@/components/Header';
import { vendorSettingApi, VendorSettingDTO, helpDeskApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vendorId = useMemo(() => user?.id || '1', [user]); // demo fallback
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Which section is active by URL
  const activeSection: 'general'|'account'|'preferences' =
    location.pathname.endsWith('/account') ? 'account' : location.pathname.endsWith('/preferences') ? 'preferences' : 'general';

  // Form state for vendor settings sections
const [general, setGeneral] = useState({
  confirmBeforeBooking: true,
});
  const [account, setAccount] = useState<VendorSettingDTO['account']>({ contactEmail: '', contactPhone: '', supportEmail: '' });
  const [preferences, setPreferences] = useState<VendorSettingDTO['preferences']>({ language: 'en', timezone: 'Asia/Kolkata', notifications: { email: true, sms: false, push: false } });
const [ticket, setTicket] = useState({
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
});

  // Load existing settings
  useEffect(() => {
    if (user) {
      setTicket(prev => ({
        ...prev,
        name: user.firstName ? `${user.firstName} ${user.lastName}` : prev.name,
        email: user.email || prev.email,
        phone: user.phoneNumber || user.phone || prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const res = await vendorSettingApi.get(vendorId);
        const data = res.data;
        setGeneral(data.general || general);
        setAccount(data.account || account);
        setPreferences(data.preferences || preferences);
        // Update favicon and title when loaded
        if (data.general?.faviconUrl) {
          const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
          if (link) link.href = data.general.faviconUrl;
        }
        if (data.general?.siteName) {
          document.title = data.general.siteName;
        }
      } catch (e) {
        // If not found, create default
        await vendorSettingApi.create({ vendorId, general, account, preferences });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const handleToggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleSubmitTicket = async () => {
    if (!ticket.name || !ticket.phone || !ticket.email || !ticket.subject || !ticket.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ticket.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(ticket.phone.replace(/\D/g, ''))) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    try {
      await helpDeskApi.create({
        name: ticket.name,
        phoneNumber: ticket.phone,
        email: ticket.email,
        subject: ticket.subject,
        description: ticket.message,
        vendorId: user?.id,
        vendorName: user?.firstName ? `${user.firstName} ${user.lastName}` : ticket.name,
        vendorEmail: user?.email || ticket.email
      } as any);
      setShowSuccessModal(true);
      setTicket({
        name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
        phone: user?.phoneNumber || user?.phone || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to submit ticket');
    }
  };

  const navLinks = [
    { href: '/settings',             label: 'General',      key: 'general'     },
    { href: '/settings/account',     label: 'Raise Ticket', key: 'account'     },
    { href: '/settings/preferences', label: 'Preferences',  key: 'preferences' },
  ];

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-950 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Settings" />

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* ── Settings nav tabs ── */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-fit">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => navigate(link.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    activeSection === link.key
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* ── General Settings ── */}
            <div className={'space-y-4 ' + (activeSection === 'general' ? '' : 'hidden')}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">General Settings</h2>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                <div className="flex items-center justify-between p-5">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Confirmation before accepting booking
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When enabled, complete assessment is required
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={general.confirmBeforeBooking}
                      onChange={(e) => setGeneral({ ...general, confirmBeforeBooking: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer transition-all"
                      style={{ '--tw-peer-checked': '#3BD9DA' } as React.CSSProperties}
                    >
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${general.confirmBeforeBooking ? 'translate-x-5' : ''}`} />
                    </div>
                    <div
                      className="absolute inset-0 rounded-full transition-all pointer-events-none"
                      style={general.confirmBeforeBooking ? { background: '#3BD9DA' } : {}}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* ── Raise Ticket ── */}
            <div className={'space-y-4 ' + (activeSection === 'account' ? '' : 'hidden')}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Raise Issue Ticket</h2>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Name',         key: 'name',    type: 'text',  placeholder: 'Your name' },
                    { label: 'Phone Number', key: 'phone',   type: 'text',  placeholder: 'Enter 10 digit number' },
                    { label: 'Email',        key: 'email',   type: 'email', placeholder: 'example@email.com' },
                    { label: 'Subject',      key: 'subject', type: 'text',  placeholder: 'Subject' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</label>
                      <Input
                        type={type}
                        placeholder={placeholder}
                        value={(ticket as any)[key]}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (key === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
                          setTicket({ ...ticket, [key]: val });
                        }}
                        onKeyDown={key === 'phone' ? (e) => {
                          if (!/[0-9]/.test(e.key) && !['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
                        } : undefined}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Message</label>
                  <Textarea
                    className="min-h-[120px] resize-none"
                    placeholder="Describe your issue in detail…"
                    value={ticket.message}
                    onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitTicket}
                    className="px-6 font-semibold text-[#131313] rounded-xl"
                    style={{ background: '#3BD9DA' }}
                  >
                    Submit Ticket
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Success Modal */}
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
  <DialogContent className="sm:max-w-[560px] p-10 text-center border-0 rounded-2xl bg-white dark:bg-gray-900">
    
    <div className="flex flex-col items-center space-y-8">

      {/* SUCCESS ICON */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border border-green-300 opacity-40"></div>
        <div className="absolute inset-3 rounded-full bg-green-100 dark:bg-green-900/30"></div>
        <div className="absolute inset-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <Check size={28} className="text-white" strokeWidth={3} />
        </div>
      </div>

      {/* TEXT */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white font-geist">
          Thank you for submitting<br />your details!
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed font-plus-jakarta">
          Our team will review your information and get in touch with you shortly.
          Stay tuned for an exciting journey ahead!
        </p>
      </div>

      {/* BUTTON */}
      <Button
        onClick={() => setShowSuccessModal(false)}
        className="w-full max-w-sm h-12 rounded-full font-semibold text-[#131313]"
        style={{ background: '#3BD9DA' }}
      >
        Back to Home
      </Button>

    </div>
  </DialogContent>
</Dialog>


      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </div>
  );
};

export default Settings;
