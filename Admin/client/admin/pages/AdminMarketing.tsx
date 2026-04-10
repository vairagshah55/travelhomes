import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminSidebar from "../components/AdminSidebar";
import AdminProfileDropdown from "../components/AdminProfileDropdown";
import { Bell, ChevronDown, Download, Copy, X } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { getImageUrl } from "@/lib/utils";


interface ContentItem {
  id: string;
  images: string[];
  additionalCount?: number;
  content: string;
}

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem?: ContentItem;
  onPost: (item: ContentItem, platform: 'instagram' | 'facebook') => void;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Split by newlines first
  const lines = content.split('\n');

  return (
    <div className="whitespace-pre-wrap font-poppins text-base leading-[150%] text-[#485467]">
      {lines.map((line, i) => {
        // Simple regex-based parsing for each line
        // Matches **bold**, __underline__, *italic*
        const parts = line.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|\[.*?\]\(.*?\))/g);
        
        return (
          <div key={i} className={`${line.trim() === '' ? 'h-4' : ''}`}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
              } else if (part.startsWith('__') && part.endsWith('__')) {
                return <u key={j} className="underline">{part.slice(2, -2)}</u>;
              } else if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={j} className="italic">{part.slice(1, -1)}</em>;
              } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const [text, url] = part.slice(1, -1).split('](');
                return <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{text}</a>;
              } else {
                return <span key={j}>{part}</span>;
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  contentItem,
  onPost,
}) => {
  if (!isOpen || !contentItem) return null;

  const images = contentItem.images || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-4">
            <h2 className="text-black font-geist text-2xl font-bold">
              Content
            </h2>
            <button
              onClick={onClose}
              className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 pb-5 space-y-6">
            {/* Photos Section */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#334054] font-plus-jakarta text-base font-semibold">
                    Photos
                  </h3>
                  <Download size={24} className="text-black cursor-pointer" />
                </div>

                {/* Photo Grid */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {/* First Image (Large) */}
                  {images[0] && (
                    <img
                      src={getImageUrl(images[0])}
                      alt="Main content"
                      className="w-[294px] h-[294px] rounded-2xl object-cover flex-shrink-0"
                    />
                  )}
                  
                  {/* Additional Images Grid */}
                  {images.length > 1 && (
                    <div className="flex gap-3 flex-wrap max-w-[500px]">
                      {images.slice(1).map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img)}
                          alt={`Content ${idx + 1}`}
                          className="h-[142px] w-[142px] rounded-2xl object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Name Section */}
            <div className="space-y-3">
              <h3 className="text-[#334054] font-plus-jakarta text-base font-semibold">
                Service Name
              </h3>
              <div className="relative">
                <div className="p-4 border border-[#B0B0B0] rounded-lg bg-white min-h-[120px]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <MarkdownRenderer content={contentItem.content} />
                    </div>
                    <Copy
                      size={20}
                      className="text-[#737373] ml-3 flex-shrink-0 cursor-pointer hover:text-black"
                      onClick={() => {
                        navigator.clipboard.writeText(contentItem.content);
                        toast.success('Content copied!');
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Post Button */}
            <div className="pt-4 flex gap-4">
              <button 
                onClick={() => onPost(contentItem, 'instagram')}
                className="flex-1 h-12 bg-[#E1306C] text-white rounded-[60px] font-geist text-base font-medium hover:bg-[#E1306C]/90 transition-colors"
              >
                Post to Instagram
              </button>
              <button 
                onClick={() => onPost(contentItem, 'facebook')}
                className="flex-1 h-12 bg-[#1877F2] text-white rounded-[60px] font-geist text-base font-medium hover:bg-[#1877F2]/90 transition-colors"
              >
                Post to Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



const AdminMarketing = () => {
  const navigate = useNavigate();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const res = await fetch('/api/admin/marketing/content', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
           if (res.status === 401) {
             localStorage.removeItem('adminToken');
             sessionStorage.removeItem('adminToken');
             navigate('/admin/login');
             return;
           }
           throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        
        if (!Array.isArray(data)) {
           console.error("API returned non-array:", data);
           // If backend returns { success: false, ... } or similar
           throw new Error("Invalid response format");
        }

        const items: ContentItem[] = data.map((d: any) => ({
          id: d._id,
          images: d.images || [],
          additionalCount: d.additionalCount || 0,
          content: d.content || '',
        }));
        setContentItems(items);
      } catch (e: any) {
        console.error("Fetch error:", e);
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);



  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );
  const [showContentModal, setShowContentModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);


  const handlePost = async (item: ContentItem, platform: 'instagram' | 'facebook') => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await fetch('/api/admin/marketing/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: item.id,
          platform
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully posted to ${platform}!`);
      } else {
        toast.error(data.message || `Failed to post to ${platform}`);
      }
    } catch (error) {
      console.error('Post error:', error);
      toast.error('An error occurred while posting.');
    }
  };

  const handleContentClick = (item: ContentItem) => {
    setSelectedContent(item);
    setShowContentModal(true);
  };

  const handlePostDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
       <div className="fixed">

      <AdminSidebar
        showMobileSidebar={mobileOpen}
        setShowMobileSidebar={setMobileOpen}
        />
        </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader
          Headtitle={"Marketing"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 pr-5 lg:pr-5">
          {/* Content Header */}
          <div className="bg-white rounded-t-3xl border-b border-[#EAECF0] min-h-[75px] flex items-center justify-between px-5">
            <h2 className="text-[#101828] font-geist text-xl font-bold  leading-[140%] -tracking-[0.4px]">
              Marketing Content
            </h2>

          </div>

          {/* Content Table */}
          <div className="bg-white px-5 py-6 rounded-b-3xl min-h-[calc(100vh-8rem)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
               <div className="flex items-center justify-center h-64 text-red-500">
                {error}
              </div>
            ) : (
            <div className="border border-[#EAECF0] rounded-xl bg-white overflow-scroll" >
              {/* Table Header */}
              <div className="bg-[#F2F4F7] rounded-t-xl flex">
                <div className="w-[155px] bg-[#F2F4F7] mx-5 px-4 py-3">
                  <div className="text-[#334054] font-plus-jakarta text-sm font-bold">
                    Photos/Reels
                  </div>
                </div>
                <div className="flex-1 bg-[#F2F4F7] mx-5 px-3 py-3">
                  <div className="text-[#334054] font-plus-jakarta text-sm font-bold">
                    Content
                  </div>
                </div>
                <div className="w-32 bg-[#F2F4F7] mx-5 px-3 py-3">
                  <div className="text-[#334054] font-plus-jakarta text-sm font-bold">
                    Action
                  </div>
                </div>
              </div>

              {contentItems.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-plus-jakarta">
                  No marketing content found.
                </div>
              )}

              {/* Table Rows */}
              {contentItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start ${index !== contentItems.length - 1 ? "border-b border-[#F2F4F7]" : ""}`}
                >
                  {/* Photos Column */}
                  <div className="w-[155px] mx-5 p-2 pl-4">
                    <div className="flex items-center gap-3">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={getImageUrl(item.images[0])}
                          alt="Content"
                          className="w-[70px] h-[70px] rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleContentClick(item)}
                        />
                      ) : (
                        <div 
                          className="w-[70px] h-[70px] rounded-md bg-gray-100 flex items-center justify-center cursor-pointer"
                          onClick={() => handleContentClick(item)}
                        >
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                      {item.additionalCount && item.additionalCount > 0 && (
                        <div className="w-10 h-10 rounded-full border border-[#BEBEBE] flex items-center justify-center">
                          <span className="text-[#212121] font-plus-jakarta text-sm font-bold">
                            +{item.additionalCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 px-3 mx-5 py-[14px]">
                    <div className="overflow-scroll max-md:h-28">
                      <MarkdownRenderer content={item.content} />
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className="w-32 px-3 mx-5 py-1.5 flex items-center justify-start">
                    <div className="relative">
                      <button
                        onClick={() => handlePostDropdown(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-[#131313] rounded-[30px] hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[#131313] font-poppins text-xs font-medium">
                          Post
                        </span>
                        <ChevronDown
                          size={18}
                          className="text-[#191919]"
                          strokeWidth={1.5}
                        />
                      </button>

                      {/* Post Dropdown */}
                      {openDropdown === item.id && (
                        <div className="absolute top-full left-0 mt-2 w-[160px] bg-white rounded-lg border border-gray-100 shadow-xl z-20 overflow-hidden">
                          <div className="flex flex-col">
                            <button 
                              onClick={() => {
                                handlePost(item, 'instagram');
                                setOpenDropdown(null);
                              }}
                              className="px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 group"
                            >
                              <span className="text-[#2A2A2A] font-poppins text-sm font-medium group-hover:text-black">
                                Instagram
                              </span>
                            </button>
                            <button 
                              onClick={() => {
                                handlePost(item, 'facebook');
                                setOpenDropdown(null);
                              }}
                              className="px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                            >
                              <span className="text-[#2A2A2A] font-poppins text-sm font-medium group-hover:text-black">
                                Facebook
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Modal */}
      <ContentModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        contentItem={selectedContent || undefined}
        onPost={handlePost}
      />


    </div>
  );
};

export default AdminMarketing;
