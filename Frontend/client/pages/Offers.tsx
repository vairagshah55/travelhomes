import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell,
  Menu,
  Plus,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Pencil,
  X as CloseIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar } from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '@/components/ProfileDropdown';
import MobileVendorNav from '@/components/MobileVendorNav';
import { DashboardHeader } from '@/components/Header';
import { offersApi, type OfferDTO, API_BASE_URL } from '@/lib/api';
import UniqueStaysSkeleton from '@/utils/UniqueStaysSkeleton';

const Offers = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');

  // Data
  const [tab, setTab] = useState<'pending' | 'approved' | 'cancelled'>('pending');
  const [items, setItems] = useState<OfferDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState<OfferDTO | null>(null);
  const [editForm, setEditForm] = useState<Partial<OfferDTO>>({});

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
      const res = await offersApi.list(tab, token || undefined, { mine: true });
      setItems(Array.isArray((res as any).data) ? (res as any).data : []);
    } catch (e: any) {
      setAlertType('error');
      setAlertMessage(e?.message || 'Failed to load offers');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const handleToggleCollapse = () => setIsCollapsed(!isCollapsed);

  const onEdit = (offer: OfferDTO) => {
    setEditing(offer);
    setEditForm({
      name: offer.name,
      category: offer.category,
      description: offer.description,
      regularPrice: offer.regularPrice,
      locality: offer.locality,
      city: offer.city,
      state: offer.state,
      pincode: offer.pincode,
    });
  };
  const onSaveEdit = async () => {
    if (!editing?._id) return;
    try {
      const res = await offersApi.update(editing._id, editForm);
      const updated = res.data.data;
      setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      setEditing(null);
      setAlertType('success');
      setAlertMessage('Offer updated');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (e: any) {
      setAlertType('error');
      setAlertMessage(e?.message || 'Update failed');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
    }
  };

  const onCancelOffer = async (id: string) => {
    try {
      await offersApi.setStatus(id, 'cancelled');
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (e: any) {
      setAlertType('error'); setAlertMessage('Failed to cancel'); setShowAlert(true); setTimeout(() => setShowAlert(false), 3000);
    }
  };
  const onDeleteOffer = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await offersApi.remove(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (e: any) {
      setAlertType('error'); setAlertMessage('Failed to delete'); setShowAlert(true); setTimeout(() => setShowAlert(false), 3000);
    }
  };

  return  (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main Content */}
      <div className="pb-10 lg:pb-0 flex-1 flex flex-col">
        {/* Header */}
             <DashboardHeader Headtitle={"Offer's"} />
     

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col pt-[80px] pr-5 pb-5 overflow-y-auto scrollbar-hide">
          {/* Alert */}
          {showAlert && (
            <div className="mx-5 mb-4 animate-in slide-in-from-top-2 duration-300">
              <Alert className={cn("border", alertType === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20')}>
                {alertType === 'success'
                  ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  : <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                <AlertDescription className={alertType === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                  {alertMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Offers Header */}
          <div className=" flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
            <h2 className="text-xl font-bold text-dashboard-title dark:text-white font-plus-jakarta">
              Offers
            </h2>
            <div className="flex gap-2">
              {(['pending','approved','cancelled'] as const).map(t => (
                <Button key={t} variant={tab===t? 'default':'outline'} onClick={()=>setTab(t)} className={tab===t? 'bg-dashboard-primary text-white':''}>
                  {t[0].toUpperCase()+t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Offers List */}
          <div className="flex-1 p-5 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="border border-dashboard-stroke rounded-xl overflow-auto">
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3 text-sm font-bold">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Actions</div>
                </div>
                {loading ? (
                  <UniqueStaysSkeleton/>
                ) : (
                  items.map((o, idx) => (
                    <div key={o._id || idx} className={`grid grid-cols-12 gap-3 px-4 py-3 items-center ${idx!==items.length-1? 'border-b border-gray-100':''}`}>
                      <div className="col-span-4 flex items-center gap-3">
                        {o.photos?.coverUrl ? (
                          <img
                            src={/^https?:\/\//i.test(o.photos.coverUrl) || o.photos.coverUrl.startsWith('data:') ? o.photos.coverUrl : `${API_BASE_URL}${o.photos.coverUrl.startsWith('/') ? '' : '/'}${o.photos.coverUrl}`}
                            alt="cover"
                            className="w-10 h-10 rounded object-cover"
                            onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200"/>
                        )}
                        <div className="font-medium">{o.name}</div>
                      </div>
                      <div className="col-span-2">{o.category}</div>
                      <div className="col-span-2">₹{o.regularPrice ?? '-'}</div>
                      <div className="col-span-2">{[o.locality,o.city,o.state].filter(Boolean).join(', ')}</div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={()=>onEdit(o)} className="flex items-center gap-1"><Pencil size={14}/>Edit</Button>
                        {tab!=='cancelled' && (<Button size="sm" variant="destructive" onClick={()=>onCancelOffer(o._id!)}>Cancel</Button>)}
                        <Button size="sm" variant="destructive" onClick={()=>onDeleteOffer(o._id!)}>Delete</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Edit Modal */}
          {editing && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Edit Offer</h3>
                  <button onClick={()=>setEditing(null)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><CloseIcon size={16}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={editForm.name as any || ''} onChange={e=>setEditForm(f=>({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={editForm.category as any || ''} onChange={e=>setEditForm(f=>({ ...f, category: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input value={editForm.description as any || ''} onChange={e=>setEditForm(f=>({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input type="number" value={String(editForm.regularPrice ?? '')} onChange={e=>setEditForm(f=>({ ...f, regularPrice: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Locality</Label>
                    <Input value={editForm.locality as any || ''} onChange={e=>setEditForm(f=>({ ...f, locality: e.target.value }))} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={editForm.city as any || ''} onChange={e=>setEditForm(f=>({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={editForm.state as any || ''} onChange={e=>setEditForm(f=>({ ...f, state: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={editForm.pincode as any || ''} onChange={e=>setEditForm(f=>({ ...f, pincode: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={()=>setEditing(null)}>Close</Button>
                  <Button onClick={onSaveEdit} className="bg-dashboard-primary text-white">Save</Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end items-center gap-4 px-5 py-4 bg-white dark:bg-gray-800 dark:border-gray-600">
            <Button variant="ghost" onClick={() => navigate('/marketing')} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-geist">Back</Button>
          </div>
        </div>
      </div>
      <div className='fixed'><MobileVendorNav/></div>
    </div>
  );
};

export default Offers;
