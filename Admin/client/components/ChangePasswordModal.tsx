import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    
    // Here you would typically make an API call to change the password
    console.log('Password change submitted:', {
      currentPassword,
      newPassword,
    });
    
    // Reset form and close modal
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
    
    // Show success message
    toast.success('Password changed successfully!');
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 bg-white border-0 shadow-xl">
        {/* Modal Background Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-25 z-[-1]" />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-xl p-8">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <X size={16} className="text-black" />
          </button>

          {/* Header */}
          <DialogHeader className="space-y-3 mb-7">
            <DialogTitle className="text-2xl font-bold text-black font-geist">
              Change new password
            </DialogTitle>
            <p className="text-base text-dashboard-title font-plus-jakarta opacity-75">
              Enter different password with previous one
            </p>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Current Password */}
              <div className="space-y-3">
                <Label 
                  htmlFor="currentPassword" 
                  className="text-base text-dashboard-title font-plus-jakarta"
                >
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="123456#Badal"
                  className="w-full px-3 py-4 border border-gray-300 rounded-lg text-base text-dashboard-neutral-07 font-plus-jakarta focus:border-dashboard-primary focus:ring-1 focus:ring-dashboard-primary"
                />
              </div>

              {/* New Password */}
              <div className="space-y-3">
                <Label 
                  htmlFor="newPassword" 
                  className="text-base text-dashboard-title font-plus-jakarta"
                >
                  Create New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="123456#Badal"
                  className="w-full px-3 py-4 border border-gray-300 rounded-lg text-base text-dashboard-neutral-07 font-plus-jakarta focus:border-dashboard-primary focus:ring-1 focus:ring-dashboard-primary"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <Label 
                  htmlFor="confirmPassword" 
                  className="text-base text-dashboard-title font-plus-jakarta"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="123456#Badal"
                  className="w-full px-3 py-4 border border-gray-300 rounded-lg text-base text-dashboard-neutral-07 font-plus-jakarta focus:border-dashboard-primary focus:ring-1 focus:ring-dashboard-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-dashboard-primary hover:bg-gray-800 text-white py-3 px-8 rounded-full text-base font-geist transition-colors"
              >
                Re-set Password
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
