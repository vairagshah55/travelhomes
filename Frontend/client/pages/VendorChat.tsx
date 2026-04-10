import React, { useEffect, useRef, useState, useCallback } from "react";
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";
import { io, Socket } from 'socket.io-client';

import { FiArrowLeft, FiArrowRight, FiCopy, FiTrash2, FiX } from "react-icons/fi";
import { MdEmail, MdExpandLess, MdLocationOn } from "react-icons/md";
import { IoDocumentText } from "react-icons/io5";
import { FaCamera, FaPhoneAlt, FaVideo } from "react-icons/fa";
import { GrGallery } from "react-icons/gr";
import { RiContactsFill } from "react-icons/ri";
import { BsPinAngleFill } from "react-icons/bs";
// import { ShareIcon } from "lucide-react";
import { IoIosSend } from "react-icons/io";

import Header from "@/components/Header";
import { SendIcon } from "lucide-react";
import MobileUserNav from "@/components/MobileUserNav";
import { Sidebar } from "@/components/Navigation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const socket: Socket = io(API_BASE_URL);

const formatRelativeTime = (date: Date | string) => {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ExpandableText = ({ text, limit = 40, isMe }: { text: string; limit?: number; isMe: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const words = text.split(/\s+/);

  if (words.length <= limit) {
    return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{text}</p>;
  }

  const displayedText = isExpanded ? (text + " ") : (words.slice(0, limit).join(" ") + "... ");

  return (
    <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
      {displayedText}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={`font-bold hover:underline ${isMe ? "text-blue-300" : "text-blue-600"}`}
      >
        {isExpanded ? "Read Less" : "Read More"}
      </button>
    </div>
  );
};

const VendorChat = () => {
  const { user: currentUser } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
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
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
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

  const [chatProfile, setChatProfile] = useState<{id: string, name: string, photo: string, type: 'Vendor' | 'User'} | null>(null);

  useEffect(() => {
    const fetchChatProfile = async () => {
      if (!currentUser?.email) return;
      try {
        const type = currentUser.userType === 'vendor' ? 'vendor' : 'user';
        const res = await fetch(`${API_BASE}/api/vendorchats/profile?email=${currentUser.email}&type=${type}`);
        const json = await res.json();
        if (json.success) {
            setChatProfile(json.data);
            if (json.data.id) {
                console.log("Joining Identity Room:", json.data.id);
                socket.emit("join_identity", json.data.id);
            }
        }
      } catch (e) {
        console.error('Failed to fetch chat profile', e);
      }
    };
    fetchChatProfile();
  }, [currentUser, API_BASE]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
      if (!chatProfile?.id) return;
      try {
        setLoadingConversations(true);
        const participantKind = chatProfile.type;
        const res = await fetch(`${API_BASE}/api/vendorchats/conversations?participantKind=${participantKind}&participantId=${chatProfile.id}`);
        const json = await res.json();
        if (json.success) {
           const mappedChats = json.data.map((c: any) => {
             // Determine the "other" participant
             const other = c.participants.find((p: any) => p.refId._id !== chatProfile.id && p.refId !== chatProfile.id);
             const otherUser = other?.refId || {};
             
             return {
               id: c._id, // Conversation ID
               name: otherUser.name || otherUser.brandName || otherUser.personName || otherUser.email || 'Unknown',
               type: 'Direct',
               lastSeen: formatRelativeTime(c.updatedAt || c.createdAt),
               lastMessageTime: c.updatedAt || c.createdAt,
               preview: c.lastMessage || 'No messages yet',
               avatar: otherUser.photo || "https://i.pravatar.cc/40?img=1",
               isOnline: false,
               messages: [], // Will load on select
               participants: c.participants,
               unreadCount: c.unreadCount || 0
             };
           });
           setChats(mappedChats);
           socket.emit("join_all_user_rooms", mappedChats.map((c: any) => c.id));
        }
      } catch (e) {
        console.error('Failed to fetch conversations', e);
      } finally {
        setLoadingConversations(false);
      }
  }, [chatProfile, API_BASE]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Update lastSeen relative time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setChats(prevChats => prevChats.map(chat => ({
        ...chat,
        lastSeen: formatRelativeTime(chat.lastMessageTime)
      })));
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Load messages when a chat is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser?.id || !chatProfile?.id) return;
      
      try {
        setLoadingChat(true);
        const res = await fetch(`${API_BASE}/api/vendorchats/conversations/${selectedUser.id}/messages`);
        const json = await res.json();
        
        if (json.success) {
          const msgs = json.data || [];
          const mapped = msgs.map((m: any) => ({
            id: m._id,
            sender: m.senderId?.name || m.senderId?.brandName || (m.senderKind === 'Vendor' ? 'Vendor' : 'You'),
            text: m.content || '',
            time: new Date(m.timestamp || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawTime: m.timestamp || m.createdAt,
            me: (m.senderId?._id || m.senderId) === chatProfile.id,
            attachments: m.attachments?.map((a: any) => ({
                type: a.mimetype?.startsWith('image/') ? 'image' : 'document',
                url: a.url?.startsWith('http') ? a.url : `${API_BASE}${a.url}`,
                name: a.filename
            }))
          }));
          
          setSelectedUser((prev: any) => ({ ...prev, messages: mapped }));

          // Reset unread count for this chat locally
          setChats(prev => prev.map(c => c.id === selectedUser.id ? { ...c, unreadCount: 0 } : c));
        }
      } catch (e) {
        console.error('Load messages failed', e);
      } finally {
        setLoadingChat(false);
      }
    };
    loadMessages();
    
    // socket.on("receive_message", loadMessages); // REMOVED LOCAL HANDLER

    // return () => {
    //    socket.off("receive_message", loadMessages);
    // };
  }, [selectedUser?.id, chatProfile, API_BASE]);

  // Global Socket Listener for Real-time Updates
  useEffect(() => {
    const handleReceiveMessage = (data: any) => {
        // Check if chat exists in local state
        const chatExists = chats.find(c => c.id === data.chatId);
        
        // If chat doesn't exist, we might be the recipient of a NEW conversation
        if (!chatExists) {
            fetchConversations();
            return;
        }

        // 1. Update Chats List (Preview & Reorder)
        setChats(prevChats => {
            const updatedChats = prevChats.map(c => {
                if (c.id === data.chatId) {
                    const isSelected = selectedUser?.id === data.chatId;
                    return {
                        ...c,
                        preview: data.content || (data.attachments?.length ? (data.attachments[0].type === 'image' ? '📷 Photo' : '📄 File') : 'Attachment'),
                        lastSeen: "Just now",
                        lastMessageTime: new Date(),
                        unreadCount: isSelected ? 0 : (c.unreadCount + 1)
                    };
                }
                return c;
            });
            // Move to top
            return updatedChats.sort((a, b) => (a.id === data.chatId ? -1 : 1));
        });

        // 2. Update Selected User Messages (if active)
        setSelectedUser((currentSelected) => {
            if (currentSelected?.id === data.chatId) {
                 // Check if it's my message (senderId matches chatProfile.id)
                 // The sender already added it optimistically, so we skip adding it again
                 const isMe = (data.senderId === chatProfile?.id);
                 if (isMe) return currentSelected;

                 const newMessage = {
                    id: data.id || data._id,
                    sender: currentSelected.name, // Assuming it's the other person
                    text: data.content || '',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    rawTime: new Date(),
                    me: false,
                    attachments: data.attachments?.map((a: any) => ({
                        type: a.mimetype?.startsWith('image/') ? 'image' : 'document',
                        url: a.url?.startsWith('http') ? a.url : `${API_BASE}${a.url}`,
                        name: a.filename
                    }))
                };
                
                return {
                    ...currentSelected,
                    messages: [...currentSelected.messages, newMessage]
                };
            }
            return currentSelected;
        });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
        socket.off("receive_message", handleReceiveMessage);
    };
  }, [chatProfile, API_BASE, chats, fetchConversations]);

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
      rawTime: new Date(),
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

      await fetch(`${API_BASE}/api/vendorchats/conversations/${selectedUser.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            senderKind: chatProfile?.type || (currentUser.userType === 'vendor' ? 'Vendor' : 'User'), 
            senderId: chatProfile?.id || currentUser.id, 
            content: newMessage.text,
            attachments: uploadedAttachments
        }),
      });

      // Find recipient ID
      const recipient = selectedUser.participants?.find((p: any) => 
          (p.refId?._id || p.refId) !== chatProfile?.id
      );
      const recipientId = recipient?.refId?._id || recipient?.refId;

      socket.emit("send_message", {
          chatId: selectedUser.id,
          senderKind: chatProfile?.type || (currentUser.userType === 'vendor' ? 'Vendor' : 'User'), 
          senderId: chatProfile?.id || currentUser.id, 
          content: newMessage.text,
          attachments: uploadedAttachments,
          recipientId
      });
      
    } catch (e) {
      console.error('Send failed', e);
    }
  };

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.text);
    toast.success("Message copied!", {
      duration: 2000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '10px',
      },
    });
  };

  const handleForward = (msg) => {
    console.log("Forwarding message:", msg);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setStarted(true);
    socket.emit("join_chat", user.id);
  };

  useEffect(() => {
    const convId = location.state?.conversationId;
    if (convId && chats.length > 0) {
      const found = chats.find(c => c.id === convId);
      if (found && selectedUser?.id !== convId) {
        selectUser(found);
        // Clear state to avoid re-selection on back navigation/re-renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [chats, location.state, selectedUser?.id]);

  const handleLongPressStart = (idx) => {
    const timer = setTimeout(() => {
      setSelectedMessageIdx(idx);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDeleteMessage = async (index) => {
    const msgToDelete = selectedUser.messages[index];
    if (!msgToDelete.id) {
        // Fallback for optimistic messages that might not have ID yet
        const updatedMessages = selectedUser.messages.filter((_, i) => i !== index);
        setSelectedUser({ ...selectedUser, messages: updatedMessages });
        setSelectedMessageIdx(null);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/vendorchats/messages/${msgToDelete.id}`, {
            method: 'DELETE'
        });
        const json = await res.json();
        if (json.success) {
            const updatedMessages = selectedUser.messages.filter((_, i) => i !== index);
            setSelectedUser({ ...selectedUser, messages: updatedMessages });
            toast.success("Message deleted");
        } else {
            toast.error("Failed to delete message");
        }
    } catch (e) {
        console.error("Delete failed", e);
        toast.error("Error deleting message");
    }
    setSelectedMessageIdx(null);
  };

  const ChatList = () => {
    const unreadChatsCount = chats.filter(c => c.unreadCount > 0).length;

    return (
    <div className="w-full md:w-1/3 h-screen bg-white border-r flex flex-col border-t">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
           <h2 className="text-2xl font-semibold text-black dark:text-white">Chats</h2>
          
        </div>
        <div className="border rounded-full w-12 h-12 flex items-center justify-center">
          <MdEmail /> 
          {unreadChatsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadChatsCount}
              </span>
           )}

        </div>
      </div>
      <div className="flex-1 overflow-y-auto  pt-6 scrollbar-hide">
        {loadingConversations ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
            <p className="text-gray-500 text-sm font-medium">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <p className="text-gray-500 mb-4 font-medium">No conversations yet.</p>
                <p className="text-gray-400 text-sm text-center">Your conversations with users will appear here once they contact you.</p>
            </div>
        ) : (
          chats
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
                  selectUser(user);
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
                      <p className={`font-medium text-sm ${user.unreadCount > 0 ? "text-black font-bold" : ""}`}>{user.name}</p>
                      <p className={`text-xs ${user.unreadCount > 0 ? "text-black font-bold" : "text-gray-500"}`}>
                        {user.preview?.length > 35 
                          ? user.preview.slice(0, 35) + "..." 
                          : user.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] ${user.unreadCount > 0 ? "text-blue-600 font-bold" : "text-gray-500"}`}>
                          {user.lastSeen}
                        </span>
                        {user.unreadCount > 0 && (
                          <div className="flex flex-col items-center gap-1">
                             <span className="bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                                {user.unreadCount}
                             </span>
                                 </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
    );
  };

  const ChatPanel = () => (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 w-full border-t relative">
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
                  className="lg:hidden text-black dark:text-white px-2 pr-4"
                >
                  <FiArrowLeft className="text-2xl" />
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
          <div className="flex-1 p-4 overflow-y-auto space-y-4 relative"
            style={{
              backgroundImage: chatWallpaper ? `url(${chatWallpaper})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}>
            {loadingChat ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading messages...</p>
               </div>
            ) : null}
            {selectedUser.messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`relative flex items-end gap-2 group ${msg.me ? "justify-end" : "justify-start"}`}
                onMouseDown={() => handleLongPressStart(idx)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(idx)}
                onTouchEnd={handleLongPressEnd}
              >
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

                  {msg.text && <ExpandableText text={msg.text} limit={40} isMe={msg.me} />}
                  <div className={`text-[10px] mt-1 flex justify-end gap-1 ${msg.me ? "text-gray-300" : "text-gray-500"}`}>
                    {/* <span>{formatRelativeTime(msg.rawTime)}</span> */}
                    <span>{msg.time}</span>
                  </div>
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
                 <div className={`absolute -bottom-8 ${msg.me ? "right-10" : "left-10"} ${selectedMessageIdx === idx ? "flex" : "hidden"} gap-1 bg-white shadow-sm border p-1 rounded-[10px] z-10`}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(msg);
                      setSelectedMessageIdx(null);
                    }} 
                    className="p-1 hover:bg-gray-50 rounded text-gray-500"
                  >
                    <FiCopy size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMessage(idx);
                      setSelectedMessageIdx(null);
                    }} 
                    className="p-1 hover:bg-gray-50 rounded text-red-400"
                  >
                    <FiTrash2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMessageIdx(null);
                    }} 
                    className="p-1 hover:bg-gray-50 rounded text-gray-400"
                  >
                    <FiX size={12} />
                  </button>
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
      {currentUser?.userType === 'vendor' && (
        <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
          <Sidebar />
        </div>
      )}


  
      {/* Desktop Header */}
      <div >
    
      </div>

      {/* Responsive Layout */}
      <div className={`dark:dark-color h-screen bg-white overflow-x-hidden  max-lg:pt-0  transition-all duration-300 ${
        currentUser?.userType === 'vendor' ? 'lg:pl-64' : ''
      }`}>
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

export default VendorChat;