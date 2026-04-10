import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bell,
  Menu,
  X,
  Bold,
  Underline,
  Italic,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Link2,
  Upload,
  Trash2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '@/components/ProfileDropdown';
import MobileVendorNav from '@/components/MobileVendorNav';
import { DashboardHeader } from '@/components/Header';
import { marketingApi, adminCmsMediaApi, MarketingContentDTO, API_BASE_URL } from '@/lib/api';

const Marketing = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [contentText, setContentText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const [items, setItems] = useState<MarketingContentDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await marketingApi.list();
      setItems(data);
    } catch (error) {
      console.error('Failed to load marketing content:', error);
    }
  };

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    setContentText(newText);

    // Defer focus and selection update to next tick
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedImages(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...files]);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    try {
      await marketingApi.delete(id);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleSubmit = async () => {
    if (!contentText && uploadedImages.length === 0) {
      toast.error('Please add some content or images.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload images
      const imageUrls: string[] = [];
      for (const file of uploadedImages) {
        const res = await adminCmsMediaApi.upload(file, 'marketing', 'content');
        if (res.success && res.data?.url) {
          imageUrls.push(res.data.url);
        }
      }

      // 2. Create content
      // Calculate additionalCount (images.length - 1 because one is usually displayed as main, and the rest as +N)
      // Or if the display logic shows 1 image and +N for the REST, then N = total - 1.
      const additionalCount = Math.max(0, imageUrls.length - 1);
      
      await marketingApi.create({
        content: contentText,
        images: imageUrls,
        additionalCount: additionalCount
      });

      // 3. Reset form & reload
      setContentText('');
      setUploadedImages([]);
      loadItems();
      toast.success('Marketing content posted successfully!');
    } catch (error: any) {
      console.error('Failed to submit marketing content:', error);
      toast.error(`Failed to submit content: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContentText('');
    setUploadedImages([]);
  };

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col ">
        {/* Header */}
               <DashboardHeader Headtitle={"Marketing"} />
       

        {/* Content Area */}
        <div className="mb-10 flex-1 flex flex-col pr-5 pb-5 overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-dashboard-title dark:text-white font-plus-jakarta">
                Upload Content
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-b-3xl ">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* Reel/Images Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-dashboard-title dark:text-gray-300 pl-1 font-plus-jakarta">
                    Reel/Images
                  </h3>
                </div>

                {/* File Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    dragActive 
                      ? 'border-dashboard-primary bg-blue-50 dark:bg-blue-900/10' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-dashboard-primary'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/991b35456b4010a2bef0b568b3cda63d07935d1b?width=148"
                        alt="Upload icon"
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    <p className="text-sm text-dashboard-body dark:text-gray-400 max-w-sm">
                      Drag and drop choose file to upload your files.{' '}
                      <br />
                      All pdf, doc, csv, xlsx types are supported
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.csv,.xlsx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Newly uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <X size={12} className="text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Write Content Section */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-dashboard-title dark:text-gray-300 pl-1 font-plus-jakarta">
                  Write an content
                </h3>
                
                <div className="border border-dashboard-stroke dark:border-gray-600 rounded-lg overflow-hidden">
                  {/* Text Editor */}
                  <Textarea
                    ref={textareaRef}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="Enter your marketing content here..."
                    className="min-h-[140px] border-0 bg-dashboard-bg dark:bg-gray-700 resize-none focus:ring-0 text-sm text-dashboard-body dark:text-gray-400 placeholder:text-dashboard-icons"
                  />
                  
                  {/* Toolbar */}
                  <div className="border-t border-dashboard-stroke dark:border-gray-600 p-3 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Text Formatting */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => insertFormat('**', '**')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Bold"
                          >
                            <Bold size={12} className="text-dashboard-body dark:text-gray-400" />
                          </button>
                          <button 
                            onClick={() => insertFormat('__', '__')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Underline"
                          >
                            <Underline size={12} className="text-dashboard-body dark:text-gray-400" />
                          </button>
                          <button 
                            onClick={() => insertFormat('*', '*')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Italic"
                          >
                            <Italic size={12} className="text-dashboard-body dark:text-gray-400" />
                          </button>
                        </div>

                        {/* Alignment - these insert standard markers or just newlines if needed, but for plain text we might skip or use chars */}
                        <div className="flex items-center gap-2">
                          <button onClick={() => insertFormat('\n')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="New Line">
                            <AlignJustify size={16} className="text-dashboard-body dark:text-gray-400" />
                          </button>
                          {/* 
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                            <AlignLeft size={16} className="text-dashboard-body dark:text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                            <AlignRight size={16} className="text-dashboard-body dark:text-gray-400" />
                          </button>
                          */}
                        </div>

                        {/* Link */}
                        <button 
                          onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) insertFormat('[', `](${url})`);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Link"
                        >
                          <Link2 size={16} className="text-dashboard-body dark:text-gray-400" />
                        </button>
                      </div>

                      {/* Separator lines (from Figma design) */}
                      <div className="flex items-center gap-1">
                        <div className="w-px h-3 bg-dashboard-stroke dark:bg-gray-600 rotate-12"></div>
                        <div className="w-px h-1.5 bg-dashboard-stroke dark:bg-gray-600 rotate-12"></div>
                        <div className="w-px h-0.5 bg-dashboard-stroke dark:bg-gray-600 rotate-12"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-4 px-5 py-4 bg-white dark:bg-gray-800 dark:border-gray-600 ">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-red-600 hover:text-red-700 font-geist"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-dashboard-primary text-white hover:bg-gray-800 rounded-full px-8 font-geist"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>

          {/* Previous Marketing Posts */}
          <div className="mt-8 px-5">
            <h3 className="text-lg font-bold text-dashboard-title dark:text-white mb-4">Previous Marketing Posts</h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-4">
                    {/* Images */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex-shrink-0">
                        <div className="flex gap-2 flex-wrap max-w-[300px]">
                        {item.images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} 
                            alt={`Marketing ${idx}`} 
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{item.content}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Posted on: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-gray-500 text-center py-8">No marketing content found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed"><MobileVendorNav/></div>
    </div>
  );
};

export default Marketing;
