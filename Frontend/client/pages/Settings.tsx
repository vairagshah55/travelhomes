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

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full ">
        <DashboardHeader Headtitle={"Settings"}/>

        <div className="flex-1 flex flex-col pr-5 pb-5 overflow-y-auto scrollbar-hide">
          <div className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-3xl ">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* General Settings Section */}
          <div className={"space-y-5 " + (activeSection === 'general' ? '' : 'hidden')}>
  <h2 className="text-xl font-bold text-dashboard-body dark:text-gray-300 font-plus-jakarta">
    General Settings
  </h2>

  <div className="border border-dashboard-stroke dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800">
    <div className="flex items-center justify-between p-5">
      
      {/* LEFT CONTENT */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-dashboard-title dark:text-gray-300">
          Confirmation before accepting booking
        </p>
        <p className="text-xs text-dashboard-muted dark:text-gray-400">
          When enabled, complete assessment is required
        </p>
      </div>

      {/* TOGGLE */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={general.confirmBeforeBooking}
          onChange={(e) =>
            setGeneral({
              ...general,
              confirmBeforeBooking: e.target.checked,
            })
          }
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:bg-black dark:peer-checked:bg-white transition-all"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
      </label>

    </div>
  </div>
</div>


              {/* Account Section */}
             <div className={"space-y-5 " + (activeSection === 'account' ? '' : 'hidden')}>

  {/* PAGE TITLE */}
  <h2 className="text-xl font-bold text-dashboard-body dark:text-gray-300 font-plus-jakarta">
    Raise Issue Ticket
  </h2>

  {/* FORM CARD */}
  <div className="bg-white dark:bg-gray-800 border border-dashboard-stroke dark:border-gray-600 rounded-2xl p-5">
    
    {/* FORM GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Name */}
      <div>
        <label className="text-sm text-dashboard-title dark:text-gray-300">
          Name
        </label>
        <Input
          placeholder="Your name"
          value={ticket.name}
          onChange={(e) => setTicket({ ...ticket, name: e.target.value })}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm text-dashboard-title dark:text-gray-300">
          Phone Number
        </label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Enter 10 digit number"
          value={ticket.phone}
          onKeyDown={(e) => {
            // Allow backspace, delete, tab, escape, enter, and numbers
            if (
              !/[0-9]/.test(e.key) &&
              !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)
            ) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            setTicket({ ...ticket, phone: val });
          }}
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-sm text-dashboard-title dark:text-gray-300">
          Email
        </label>
        <Input
          placeholder="example@email.com"
          value={ticket.email}
          onChange={(e) => setTicket({ ...ticket, email: e.target.value })}
        />
      </div>

      {/* Subject */}
      <div>
        <label className="text-sm text-dashboard-title dark:text-gray-300">
          Subject
        </label>
        <Input
          placeholder="Subject"
          value={ticket.subject}
          onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
        />
      </div>
    </div>

    {/* Message */}
    <div className="mt-4">
      <label className="text-sm text-dashboard-title dark:text-gray-300">
        Message
      </label>
      <Textarea
        className="min-h-[120px]"
        placeholder="Describe your issue..."
        value={ticket.message}
        onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
      />
    </div>

    {/* SUBMIT BUTTON */}
    <div className="flex justify-end mt-4">
      <Button 
        onClick={handleSubmitTicket}
        className="bg-black dark:bg-white text-white dark:text-black px-6"
      >
        Submit
      </Button>
    </div>
  </div>
  {/* INFO / FAQ CARD */}
<div className="mt-6 bg-white dark:bg-gray-800 border border-dashboard-stroke dark:border-gray-600 rounded-2xl p-5">
  
  <h3 className="text-sm font-semibold text-dashboard-heading dark:text-gray-200 mb-3">
    How I delete my account
  </h3>

  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-1">
    <p className="text-xs font-medium text-dashboard-title dark:text-gray-300">
      Message
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
      The alignment of the primary CTA button on the homepage appears inconsistent
      across different screen sizes. On smaller screens, the button shifts slightly
      to the right, affecting the visual balance.
    </p>
  </div>

</div>

</div>

            
         

            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
  <DialogContent className="sm:max-w-[560px] p-10 text-center border-0 rounded-2xl bg-white dark:bg-gray-800">
    
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
        className="w-full max-w-sm h-12 rounded-full bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black"
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
