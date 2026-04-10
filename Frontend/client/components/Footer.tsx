import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { settingsApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchLogo = async () => {
        try {
            const res = await settingsApi.getSeo('logo');
            if (res.success && res.data?.logoDarkUrl) {
                setLogoDarkUrl(res.data.logoDarkUrl);
            }
        } catch (e) {
            console.error("Failed to load footer logo", e);
        }
    };
    fetchLogo();
  }, []);

  // Footer is black background -> Use Dark Theme Logo (White text)
  const defaultDarkLogo = "https://api.builder.io/api/v1/image/assets/TEMP/871bfcdbcdbc969135e889b258ef410c6bcc2658?width=162";
  const logoSrc = logoDarkUrl ? getImageUrl(logoDarkUrl) : defaultDarkLogo;

  const handleSubscribe = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        setEmail("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to subscribe",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
return(
<footer className="bg-black text-white pb-4">
  <div className="max-w-7xl mx-auto py-10 px-4 sm:px-4 md:px-4 lg:px-10 mt-6">
    {/* Top Section */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
      {/* Logo + Description */}
      <div>
        <img
          src={logoSrc}
          alt="Logo"
          className="w-16 h-12 mb-4"
        />
        <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
          Caravan trips blend adventure and comfort, as travelers embark on open-road journeys in well-equipped recreational vehicles like camper vans, RVs, motorhomes, and caravans.
        </p>
      </div>

      {/* Menu Column */}
      <div>
        <h3 className="text-sm font-bold mb-2">Menu</h3>
        <ul className="space-y-2">
          <li><Link to="/about" className="text-gray-400 text-sm hover:text-white transition-colors">About</Link></li>
          <li><Link to="/hostwithus" className="text-gray-400 text-sm hover:text-white transition-colors">Why Host with us</Link></li>
          <li><Link to="/career" className="text-gray-400 text-sm hover:text-white transition-colors">Careers</Link></li>
        </ul>
      </div>

      {/* Support Column */}
      <div>
        <h3 className="text-sm font-bold mb-2">Support</h3>
        <ul className="space-y-2">
          <li><Link to="/contact" className="text-gray-400 text-sm hover:text-white transition-colors">Contact Us</Link></li>
          <li><Link to="/blogs" className="text-gray-400 text-sm hover:text-white transition-colors">Blog</Link></li>
        </ul>
      </div>

      {/* Newsletter */}
      <div>
        <h3 className="text-sm font-medium mb-4 capitalize">Newsletter</h3>
        <p className="text-gray-400 text-xs mb-6">
          Be the first to know about discounts, offers, and events. Unsubscribe anytime.
        </p>
        <div className="flex items-center bg-white rounded-full p-1">
          <div className="flex items-center px-2 flex-1">
            <Mail className="w-4 h-4 text-gray-600 mr-2" />
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-transparent text-gray-800 placeholder:text-gray-600 text-xs outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button 
            className="bg-black text-white rounded-full px-5 h-8 text-xs font-bold"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </div>
      </div>
    </div>

    {/* Bottom Section */}
    <div className="border-t border-gray-800 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-center text-center gap-4">
        <p className="text-gray-400 text-sm">Travel Home @ 2025 - 2030</p>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">T&C</Link>
          <span className="text-gray-500">|</span>
          <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy policy</Link>
        </div>
      </div>
    </div>
  </div>
</footer>



  );
}
