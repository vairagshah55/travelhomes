import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { settingsApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

const routeToPageMap: Record<string, string> = {
  '/': 'Homepage',
  '/about': 'About',
  '/career': 'Career',
  '/blogs': 'Blog',
  '/blogsDetials': 'Blog Details',
  '/hostwithus': 'Why Host With Us',
  '/contact': 'Contact Us',
  '/terms': 'Policy',
  '/privacy': 'Privacy Policy',
  '/help': 'Help',
};

/**
 * Routes that build their own <head> from the record they render.
 *
 * This component is route-level: one SEO record per path. That's the wrong
 * granularity for a blog post — every article resolved to the single "Blog
 * Details" record, so the whole journal shared one title, one description and
 * one share card while the per-article meta fields the CMS collects sat unused.
 * `/blogsDetials` now sets its own via `useDocumentMeta`, so skip the page
 * lookup here rather than racing it (both are async; last writer won).
 *
 * The favicon is still applied below — it's global, and dropping it would leave
 * the default icon on any article opened directly.
 */
const SELF_MANAGED_ROUTES = new Set(['/blogsDetials']);

const SEOMeta: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const updateSeo = async () => {
      const path = location.pathname;
      const pageName = routeToPageMap[path] || 'Homepage'; // Default to Homepage or handle dynamic routes better if needed

      try {
        const [pageResponse, faviconResponse] = await Promise.all([
          SELF_MANAGED_ROUTES.has(path)
            ? Promise.resolve({ success: false, data: {} as any })
            : settingsApi.getSeo(pageName),
          settingsApi.getSeo('favicon')
        ]);

        const seoData = pageResponse.success ? pageResponse.data : {};
        const faviconData = faviconResponse.success ? faviconResponse.data : {};

        if (seoData || faviconData) {
          const { metaTitle, metaDescription, metaKeywords, socialTitle, socialDescription, ogImageUrl } = seoData || {};
          const { faviconUrl } = faviconData || {};

          // Update Title
          if (metaTitle) document.title = metaTitle;

          // Helper to update meta tags
          const updateMeta = (name: string, content: string) => {
            if (!content) return;
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
              element = document.createElement('meta');
              element.setAttribute('name', name);
              document.head.appendChild(element);
            }
            element.setAttribute('content', content);
          };

           // Helper to update OG property tags
           const updateOgMeta = (property: string, content: string) => {
            if (!content) return;
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
              element = document.createElement('meta');
              element.setAttribute('property', property);
              document.head.appendChild(element);
            }
            element.setAttribute('content', content);
          };

          // Update Meta Tags
          updateMeta('description', metaDescription);
          updateMeta('keywords', metaKeywords);

          // Update Social/OG Tags
          updateOgMeta('og:title', socialTitle || metaTitle);
          updateOgMeta('og:description', socialDescription || metaDescription);
          updateOgMeta('og:image', ogImageUrl);
          
          // Update Favicon
          if (faviconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'shortcut icon';
              document.head.appendChild(link);
            }
            link.href = getImageUrl(faviconUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch SEO settings', error);
      }
    };

    updateSeo();
  }, [location]);

  return null; // This component does not render anything visual
};

export default SEOMeta;
