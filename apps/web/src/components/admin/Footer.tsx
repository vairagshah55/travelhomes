import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/871bfcdbcdbc969135e889b258ef410c6bcc2658?width=162"
              alt="Logo" 
              className="w-20 h-14 mb-4"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              Caravan trips blend adventure and comfort, as travelers embark on open-road journeys in well-equipped recreational vehicles like camper vans, RVs, motorhomes, and caravans.
            </p>
          </div>
          
          {/* Menu Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Menu</h3>
            <div className="space-y-3">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Why Host with us</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Careers</a>
            </div>
          </div>
          
          {/* Support Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <div className="space-y-3">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact Us</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Blog</a>
            </div>
          </div>
          
          {/* Newsletter Column */}
          <div>
            <h3 className="text-lg font-medium mb-4 capitalize">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-6">
              Be the first one to know about discounts, offers and events. Unsubscribe whenever you like.
            </p>
            
            <div className="flex items-center bg-white rounded-full p-1">
              <div className="flex items-center px-4 flex-1">
                <Mail className="w-4 h-4 text-gray-600 mr-2" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 bg-transparent text-gray-800 placeholder:text-gray-600 text-sm outline-none"
                />
              </div>
              <Button className="bg-black text-white rounded-full px-6 h-10 text-xs font-bold">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">Travel Home @ 2025 - 2030</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">T&C</a>
              <span className="text-gray-500">|</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
