import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { settingsService } from '../../services/api';
import { getImageUrl } from '../../lib/utils';

const AdminSEOMeta: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const response = await settingsService.getSeo('favicon');
        const faviconUrl = response?.faviconUrl;

        if (faviconUrl) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            document.head.appendChild(link);
          }
          link.href = getImageUrl(faviconUrl);
        }
      } catch (error) {
        console.error('Failed to fetch global favicon', error);
      }
    };

    updateFavicon();
  }, [location.pathname]); // Re-check on route change if needed, though mostly one-time is fine

  return null;
};

export default AdminSEOMeta;
