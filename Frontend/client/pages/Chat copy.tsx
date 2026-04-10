import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";
import { createNewChat, ChatMessage } from "@/lib/chatApi";

import { FiArrowRight, FiCopy, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { MdEmail, MdExpandLess, MdLocationOn } from "react-icons/md";
import { IoDocumentText } from "react-icons/io5";
import { FaCamera, FaPhoneAlt, FaVideo } from "react-icons/fa";
import { GrGallery } from "react-icons/gr";
import { RiContactsFill } from "react-icons/ri";
import { BsPinAngleFill } from "react-icons/bs";
// import { ShareIcon } from "lucide-react";
import { IoIosSend } from "react-icons/io";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { LinkIcon, MessageCircleIcon, MoreVertical, SendIcon } from "lucide-react";
import MobileUserNav from "@/components/MobileUserNav";

// Initial chat data
const initialChatUsers = [
  {
    id: 1,
    name: "Akash Retail",
    type: "Direct",
    lastSeen: "2m ago",
    preview: "Interested in bulk order of So...",
    avatar: "https://i.pravatar.cc/40?img=1",
    isOnline:true,
    messages: [
      {
        sender: "Akash Retail",
        text: "Hi! I'm interested in a bulk order.",
        time: "17:00",
        me: false,
      },
      {
        sender: "You",
        text: "Sure, I can help you with that!",
        time: "17:02",
        me: true,
      },
    ],
  },
  {
    id: 2,
    name: "Mike Mazowski",
    type: "Direct",
    lastSeen: "5m ago",
    preview: "Hey! Did you check the files?",
    avatar: "https://i.pravatar.cc/40?img=2",
     isOnline:true,
    messages: [
      {
        sender: "Mike Mazowski",
        text: "Did you check the vacation plan?",
        time: "18:04",
        me: false,
      },
      {
        sender: "You",
        text: "Yes, looks good to me!",
        time: "18:44",
        me: true,
      },
    ],
  },
  {
    id: 3,
    name: "Sarah Connor",
    type: "Groups",
    lastSeen: "10m ago",
    preview: "Let's meet at 5pm tomorrow.",
    avatar: "https://i.pravatar.cc/40?img=3",
    members:[1,2,3],
    messages: [
      {
        sender: "Sarah Connor",
        text: "Let's meet tomorrow at 5pm?",
        time: "14:30",
        me: false,
      },
      {
        sender: "You",
        text: "Perfect, see you then!",
        time: "14:35",
        me: true,
      },
    ],
  },
  {
    id: 4,
    name: "Dev Team",
    type: "Groups",
    lastSeen: "20m ago",
    preview: "Sprint planning at 10AM.",
    avatar: "https://i.pravatar.cc/40?img=4",
    messages: [
      {
        sender: "Dev Team",
        text: "Don’t forget sprint planning tomorrow.",
        time: "09:00",
        me: false,
      },
      { sender: "You", text: "Got it!", time: "09:05", me: true },
    ],
  },
  {
    id: 5,
    name: "Request from John Doe",
    type: "Requests",
    lastSeen: "Just now",
    preview: "Please add me to your contacts.",
    avatar: "https://i.pravatar.cc/40?img=5",
    messages: [
      {
        sender: "John Doe",
        text: "Hey! Please add me.",
        time: "08:00",
        me: false,
      },
    ],
  },
  {
    id: 6,
    name: "Request from Jane Smith",
    type: "Requests",
    lastSeen: "1m ago",
    preview: "I'd like to connect with you.",
    avatar: "https://i.pravatar.cc/40?img=6",
    messages: [
      {
        sender: "Jane Smith",
        text: "Hi there! I'd like to connect.",
        time: "12:00",
        me: false,
      },
    ],

  },
  {
    id: 7,
    name: "Akash Retail",
    type: "Direct",
    lastSeen: "2m ago",
    preview: "Interested in bulk order of So...",
    avatar: "https://i.pravatar.cc/40?img=1",
    messages: [
      {
        sender: "Akash Retail",
        text: "Hi! I'm interested in a bulk order.",
        time: "17:00",
        me: false,
      },
      {
        sender: "You",
        text: "Sure, I can help you with that!",
        time: "17:02",
        me: true,
      },
    ],
  },
  {
    id: 8,
    name: "Mike Mazowski",
    type: "Direct",
    lastSeen: "5m ago",
    preview: "Hey! Did you check the files?",
    avatar: "https://i.pravatar.cc/40?img=2",
    messages: [
      {
        sender: "Mike Mazowski",
        text: "Did you check the vacation plan?",
        time: "18:04",
        me: false,
      },
      {
        sender: "You",
        text: "Yes, looks good to me!",
        time: "18:44",
        me: true,
      },
    ],
  },
  {
    id: 9,
    name: "Sarah Connor",
    type: "Direct",
    lastSeen: "10m ago",
    preview: "Let's meet at 5pm tomorrow.",
    avatar: "https://i.pravatar.cc/40?img=3",
    messages: [
      {
        sender: "Sarah Connor",
        text: "Let's meet tomorrow at 5pm?",
        time: "14:30",
        me: false,
      },
      {
        sender: "You",
        text: "Perfect, see you then!",
        time: "14:35",
        me: true,
      },
    ],
  },
  {
    id: 10,
    name: "Dev Team",
    type: "Direct",
    lastSeen: "20m ago",
    preview: "Sprint planning at 10AM.",
    avatar: "https://i.pravatar.cc/40?img=4",
    messages: [
      {
        sender: "Dev Team",
        text: "Don’t forget sprint planning tomorrow.",
        time: "09:00",
        me: false,
      },
      { sender: "You", text: "Got it!", time: "09:05", me: true },
    ],
  },
  {
    id: 11,
    name: "shivi mukati",
    type: "Direct",
    lastSeen: "Just now",
    preview: "Please add me to your contacts.",
    avatar: "https://i.pravatar.cc/40?img=5",
    messages: [
      {
        sender: "shivi mukati",
        text: "Hey! Please add me.",
        time: "08:00",
        me: false,
      },
    ],
  },
  {
    id: 12,
    name: "Rudhra patel",
    type: "Direct",
    lastSeen: "1m ago",
    preview: "I'd like to connect with you.",
    avatar: "https://i.pravatar.cc/40?img=6",
    messages: [
      {
        sender: "Rudhra patel",
        text: "Hi there! I'd like to connect.",
        time: "12:00",
        me: false,
      },
    ],

  },
];

const MessagePage = () => {
  const { user: currentUser } = useAuth();
  const [chats, setChats] = useState(initialChatUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [filter, setFilter] = useState("Direct");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessageIdx, setSelectedMessageIdx] = useState(null);
  const [started, setStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState(null);
  const [pinnedUserIds, setPinnedUserIds] = useState([]);

  // File Preview State
  const [selectedFiles, setSelectedFiles] = useState<{file: File, type: "image" | "document", preview: string | null}[]>([]);

  const [backendUserId, setBackendUserId] = useState<string | null>(null);
  const [backendVendorId, setBackendVendorId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser?.messages]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bootstrap demo participants and conversation on first chat select
  useEffect(() => {
    const bootstrap = async () => {
      if (!selectedUser || conversationId) return;
      try {
        setLoadingChat(true);
        // Create demo user
        const uRes = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: selectedUser.name || 'Demo User',
            email: `demo_${Date.now()}@example.com`,
            phone: '9999999999',
            userSince: '2024-01-01',
            location: 'Delhi'
          }),
        });
        const uJson = await uRes.json();
        const userId = uJson?.data?._id;
        setBackendUserId(userId);

        // Create demo vendor
        const vRes = await fetch(`${API_BASE}/api/vendors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName: 'Demo Vendor', personName: 'Owner', location: 'Mumbai' }),
        });
        const vJson = await vRes.json();
        const vendorId = vJson?.data?._id;
        setBackendVendorId(vendorId);

        // Create/Get conversation
        const cRes = await fetch(`${API_BASE}/api/vendorchats/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId, userId, title: `Chat with ${selectedUser.name}` }),
        });
        const cJson = await cRes.json();
        const convId = cJson?.data?._id;
        setConversationId(convId);

        // Load messages
        await loadMessages(convId);
      } catch (e) {
        console.error('Bootstrap chat failed', e);
      } finally {
        setLoadingChat(false);
      }
    };
    bootstrap();
  }, [selectedUser]);

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/vendorchats/conversations/${convId}/messages`);
      const json = await res.json();
      const msgs = json?.data || [];
      // Map backend messages to local format
      const mapped = msgs.map((m: any) => ({
        sender: m.senderId?.name || (m.senderKind === 'Vendor' ? 'Vendor' : 'You'),
        text: m.content || '',
        time: new Date(m.timestamp || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        me: m.senderKind === 'User',
        attachments: m.attachments?.map((a: any) => ({
            type: a.mimetype?.startsWith('image/') ? 'image' : 'document',
            url: a.url?.startsWith('http') ? a.url : `${API_BASE}${a.url}`,
            name: a.filename
        }))
      }));
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, messages: mapped });
      }
    } catch (e) {
      console.error('Load messages failed', e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        type,
        preview: type === "image" ? URL.createObjectURL(file) : null
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setShowPopup(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = typeof textOverride === "string" ? textOverride : messageText;
    
    // Allow sending if text is present OR if there are files
    if ((!textToSend.trim() && selectedFiles.length === 0) || !selectedUser) return;

    // Optimistic attachments
    const optimisticAttachments = selectedFiles.map(f => ({
      type: f.type,
      url: f.preview,
      name: f.file.name
    }));

    // Optimistic UI update
    const newMessage = {
      sender: "You",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      me: true,
      attachments: optimisticAttachments.length > 0 ? optimisticAttachments : undefined
    };

    const updatedChats = chats.map((chat) =>
      chat.id === selectedUser.id
        ? {
            ...chat,
            messages: [...chat.messages, newMessage],
            preview: optimisticAttachments.length > 0 ? (optimisticAttachments[0].type === 'image' ? '📷 Photo' : '📄 Document') : (newMessage.text.slice(0, 30) + (newMessage.text.length > 30 ? "..." : "")),
            lastSeen: "Just now"
          }
        : chat
    );

    setChats(updatedChats);
    setSelectedUser({ ...selectedUser, messages: [...selectedUser.messages, newMessage] });
    setMessageText("");
    setSelectedFiles([]);
    setShowEmojis(false);
    setShowPopup(false);

    try {
      // Ensure we have conversation and participants
      if (!conversationId || !backendUserId || !backendVendorId) return;

      let uploadedAttachments = [];
      if (selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach(f => {
              formData.append('files', f.file);
          });

          const uploadRes = await fetch(`${API_BASE}/api/vendorchats/upload`, {
              method: 'POST',
              body: formData
          });
          const uploadJson = await uploadRes.json();
          if (uploadJson.success) {
              uploadedAttachments = uploadJson.data;
          }
      }

      await fetch(`${API_BASE}/api/vendorchats/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            senderKind: 'User', 
            senderId: backendUserId, 
            content: newMessage.text,
            attachments: uploadedAttachments
        }),
      });

      // Reload from server to reflect authoritative state
      // await loadMessages(conversationId);
    } catch (e) {
      console.error('Send failed', e);
    }
  };

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.text);
    toast.success("Message copied!");
  };

  const handleForward = (msg) => {
    console.log("Forwarding message:", msg);
  };

  const handleDeleteMessage = (index) => {
    const updatedMessages = selectedUser.messages.filter((_, i) => i !== index);
    setSelectedUser({ ...selectedUser, messages: updatedMessages });
    setSelectedMessageIdx(null);
  };

  const ChatList = () => (
    <div className="w-full md:w-1/3 bg-white border-r flex flex-col border-t">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-semibold text-black dark:text-white">Chats</h2>
        <div className="border rounded-full w-12 h-12 flex items-center justify-center">
          <MdEmail />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto  pt-6 scrollbar-hide">
        {chats
          .filter(
            (user) =>
              user.type === filter && user.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .sort((a, b) => {
            const aPinned = pinnedUserIds.includes(a.id);
            const bPinned = pinnedUserIds.includes(b.id);
            return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
          })
          .map((user) => (
            <div
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setStarted(true);
              }}
              className={`flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 ${
                selectedUser?.id === user.id
                  ? "bg-gray-200 dark:bg-blue-300 text-black"
                  : "hover:bg-gray-200 hover:text-black"
              } ${pinnedUserIds.includes(user.id) ? "border-blue-400 border-2" : "lg:border-y"}`}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="rounded-full w-12 h-10 max-md:w-14 max-md:h-14"
                  />
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex justify-between w-full">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.preview}</p>
                  </div>
                  <span className="text-xs text-gray-800">
                    {user.isOnline ? "Online" : user.lastSeen}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const ChatPanel = () => (
    <div className="flex-1 flex flex-col bg-gray-50 w-full border-t relative">
      {selectedUser ? (
        <>
          <div className="w-full flex justify-between items-center p-4 border-b bg-white">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setStarted(false);
                  }}
                  className="lg:hidden text-black dark:text-white px-4"
                >
                  <MdExpandLess className="rotate-[-90deg] text-2xl" />
                </button>
              )}
              <img src={selectedUser.avatar} alt="" className="rounded-full w-10 h-10" />
              <div>
                <h3 className="font-semibold text-xl">{selectedUser.name}</h3>
                <span className="text-sm text-gray-400">
                  {selectedUser.isOnline ? "Online" : selectedUser.lastSeen}
                </span>
              </div>
            </div>
            <div className="relative flex items-center space-x-3">
              {/* <button onClick={() => navigate("/videocall", { state: { user: selectedUser } })}>
                <FaPhoneAlt className="text-2xl" />
              </button>
              <button onClick={() => navigate("/videocall", { state: { user: selectedUser } })}>
                <FaVideo className="text-2xl" />
              </button> */}
          
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4"
            style={{
              backgroundImage: chatWallpaper ? `url(${chatWallpaper})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}>
            {selectedUser.messages.map((msg, idx) => (
              <div key={idx} className={`relative flex items-end gap-2 group ${msg.me ? "justify-end" : "justify-start"}`}>
                {!msg.me && (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name} 
                    className="w-8 h-8 rounded-full mb-1"
                  />
                )}
                <div 
                  className={`max-w-[350px] h-full p-3 px-5 rounded-[10px] ${
                    msg.me 
                      ? "bg-black text-white" 
                      : "bg-[#f3f4f6] text-black"
                  }`}
                >
                  {/* Attachments Grid */}
                  {msg.attachments && msg.attachments.length > 0 && (
                     <div className={`grid gap-1 mb-2 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {msg.attachments.map((att, i) => (
                           <div key={i} className="relative">
                              {att.type === 'image' ? (
                                <img src={att.url} alt="Attachment" className="rounded-lg max-w-full max-h-[300px] object-cover" />
                              ) : (
                                <div className="flex items-center gap-3 bg-black/10 p-3 rounded-lg">
                                     <div className="bg-white p-2 rounded-full text-purple-600">
                                         <IoDocumentText size={20}/>
                                     </div>
                                     <span className="text-sm underline truncate max-w-[150px]">{att.name}</span>
                                </div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}

                  {msg.text && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                </div>
                {msg.me && (
                  <img 
                    src={getImageUrl(currentUser?.photo)} 
                    alt="Me" 
                    className="w-8 h-8 rounded-full mb-1 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                    }}
                  />
                )}
                 {/* Hover Actions */}
                 <div className={`absolute -bottom-8 ${msg.me ? "right-10" : "left-10"} hidden group-hover:flex gap-1 bg-white shadow-sm border p-1 rounded-[10px] z-10`}>
                  <button onClick={() => handleCopy(msg)} className="p-1 hover:bg-gray-50 rounded text-gray-500"><FiCopy size={12} /></button>
                  <button onClick={() => handleDeleteMessage(idx)} className="p-1 hover:bg-gray-50 rounded text-red-400"><FiTrash2 size={12} /></button>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Inline File Preview (Inside Input Area Container) */}
          <div className="bg-white w-5xl mx-auto w-full">
            {selectedFiles.length > 0 && (
              <div className="flex gap-2 p-2 px-4 overflow-x-auto border-t border-gray-100 scrollbar-hide">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 shrink-0 group">
                    {file.type === 'image' && file.preview ? (
                        <img src={file.preview} className="w-full h-full object-cover rounded-md border" alt="preview" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 border rounded-md">
                          <IoDocumentText className="text-purple-500 text-2xl"/>
                        </div>
                    )}
                    <button 
                      onClick={() => removeFile(idx)} 
                      className="absolute -top-2 -right-2 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-600 rounded-full p-1 shadow-md transition-colors border"
                    >
                        <FiX size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="px-4 pb-4 pt-2 flex items-center gap-4">
              <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSend();
                      }
                    }}
                    placeholder="Ask me anything..."
                    className="w-full bg-white text-gray-800 border border-gray-200 rounded-[10px] pl-6 pr-12 py-3.5 outline-none focus:border-gray-300 focus:ring-0 shadow-sm transition-all"
                  />
                  
                  {/* Media Button inside Input */}
                  <button 
                    onClick={() => setShowPopup(!showPopup)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors"
                  >
                    <GrGallery size={20}/>
                  </button>
              </div>

              {/* Send Button */}
              <button 
                onClick={() => handleSend()} 
                disabled={!messageText.trim() && selectedFiles.length === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  messageText.trim() || selectedFiles.length > 0
                    ? "bg-black text-white hover:bg-gray-800 shadow-lg transform active:scale-95" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <SendIcon size={20} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Popup Menu (Hidden/absolute) */}
          {showPopup && (
              <div className="absolute bottom-24 right-20 bg-white border rounded-xl shadow-xl p-2 w-48 flex flex-col gap-1 z-50">
                  {/* Menu Items */}
                  <button className="flex items-center gap-3 text-sm hover:bg-gray-50 p-3 rounded-lg w-full text-left transition-colors" onClick={() => document.getElementById("galleryInput").click()}>
                    <GrGallery className="text-pink-500"/> Gallery
                  </button>
                  <input type="file" id="galleryInput" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "image")} />

                  <button className="flex items-center gap-3 text-sm hover:bg-gray-50 p-3 rounded-lg w-full text-left transition-colors" onClick={() => document.getElementById("cameraInput").click()}>
                    <FaCamera className="text-blue-500"/> Camera
                  </button>
                  <input type="file" id="cameraInput" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, "image")} />

                  <button className="flex items-center gap-3 text-sm hover:bg-gray-50 p-3 rounded-lg w-full text-left transition-colors" onClick={() => document.getElementById("docInput").click()}>
                    <IoDocumentText className="text-purple-500"/> Document
                  </button>
                  <input type="file" id="docInput" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileSelect(e, "document")} />
              </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-10">
          <div className="max-w-md mx-auto">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5665/5665756.png"
              alt="No Chat Selected"
              className="w-40 h-40 mx-auto mb-4 opacity-50"
            />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No conversation selected</h2>
            <p className="text-gray-500">Select a chat from the sidebar to start messaging.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Header */}
      <div className="dark:dark-color fixed top-0 w-full z-10 max-md:hidden">
        <Header />
      </div>

      {/* Responsive Layout */}
      <div className="dark:dark-color h-screen bg-white overflow-x-hidden pt-[64px] max-lg:pt-0 md:pt-[85px]">
        <div className="font-sans h-[calc(100vh-60px)] md:h-[calc(100vh-112px)] flex">
          {isMobile ? (
            started ? ChatPanel() : ChatList()
          ) : (
            <>
              {ChatList()}
              {ChatPanel()}
            </>
          )}
        </div>
      </div>
      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 w-full z-50">
        <MobileUserNav />
      </div>
    </>
  );
};

export default MessagePage;