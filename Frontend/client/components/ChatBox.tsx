import React, { useState, useMemo, useRef, useEffect } from "react";
import { PiPhoneCallFill } from "react-icons/pi";
import * as Popover from "@radix-ui/react-popover";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { getImageUrl } from "@/lib/utils";
import { ChatMessage , ChatMessageGroup, updateMessageReaction} from '../lib/chatApi';
import { MdEmail, MdExpandLess, MdLocationOn } from "react-icons/md";
import { IoDocumentText } from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import { FiArrowRight, FiCopy, FiTrash2, FiX } from "react-icons/fi";
import { GrGallery } from "react-icons/gr";
import { FaCamera, FaPhoneAlt, FaVideo } from "react-icons/fa";
export interface NotificationItem {
    id: number;
    text: string;
    time: string;
}

export interface ChatBoxProps {
    messagesList: ChatMessage[];
    chatMessages: ChatMessageGroup[];
    notifications?: ChatMessage[];
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    filterType?: "all" | "unread" | "read";
    onFilterChange?: (filter: "all" | "unread" | "read") => void;
    onSendMessage?: (message: string, attachments?: File[]) => void | Promise<void>;
    onMessageUpdate?: (updatedMessages: ChatMessageGroup[]) => void;
    onMessagesListUpdate?: (updatedList: ChatMessage[]) => void;
    onChatSelect?: (chat: ChatMessage) => void;
    onNotificationClick?: (notification: ChatMessage) => void;
    userAvatar?: string;
    userName?: string;
    userType?: string;
    selectedChatId?: string | null;
    isMobileres?: boolean;
}

// Common emojis for emoji picker - first 5 shown, rest on expand
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];
const ALL_EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖",
    "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏", "🙌", "👐",
    "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️",
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️",
];

export const ChatBox: React.FC<ChatBoxProps> = ({
    messagesList: initialMessagesList,
    chatMessages: initialChatMessages,
    notifications = [],
    searchQuery: externalSearchQuery,
    onSearchChange,
    filterType: externalFilterType = "all",
    onFilterChange,
    onSendMessage,
    onMessageUpdate,
    onMessagesListUpdate,
    onChatSelect,
    onNotificationClick,
    userAvatar = "/frame-10-11.png",
    userName = "You",
    userType = "",
    selectedChatId,
    isMobileres = false
}) => {
    const API_BASE_MEDIAURL = import.meta.env.VITE_BACKEND_MEDIA_URL || 'http://localhost:7002';
    const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
    const [messageText, setMessageText] = useState("");
    const [internalSearchQuery, setInternalSearchQuery] = useState("");
    const [internalFilterType, setInternalFilterType] = useState<"all" | "unread" | "read">("all");
    const usertye = localStorage.getItem('UserType');
    const [tick, setTick] = useState(0);
    const [chatWallpaper, setChatWallpaper] = useState(null);
    const { user: currentUser } = useAuth();
    const [showPopup, setShowPopup] = useState(false);
     const [selectedFiles, setSelectedFiles] = useState<{file: File, type: "image" | "document", preview: string | null}[]>([]);
    
    // Use external props if provided, otherwise use internal state
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
    const filterType = externalFilterType !== undefined ? externalFilterType : internalFilterType;
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAllEmojis, setShowAllEmojis] = useState(false);
    const [emojiPickerPosition, setEmojiPickerPosition] = useState<{ top: number; left: number; messageId: string } | null>(null);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    const handleSearchChange = (query: string) => {
        if (onSearchChange) {
            onSearchChange(query);
        } else {
            setInternalSearchQuery(query);
        }
    };
    
    const handleFilterChange = (filter: "all" | "unread" | "read") => {
        if (onFilterChange) {
            onFilterChange(filter);
        } else {
            setInternalFilterType(filter);
        }
    };
    const [attachments, setAttachments] = useState<File[]>([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
    const [messagesList, setMessagesList] = useState<ChatMessage[]>(initialMessagesList || []);
    const [chatMessages, setChatMessages] = useState<ChatMessageGroup[]>(initialChatMessages || []);
    
    // Sync with external props if they change
    useEffect(() => {
        setMessagesList(initialMessagesList || []);
    }, [initialMessagesList]);
    
    useEffect(() => {
        setChatMessages(initialChatMessages || []);
    }, [initialChatMessages]);
    
    // Sync selected chat with external prop
    useEffect(() => {
        if (selectedChatId !== undefined) {
            const chat = messagesList.find(msg => msg._id === selectedChatId);
            if (chat) {
                setSelectedChat(chat);
            } else if (selectedChatId === null) {
                setSelectedChat(null);
            }
        }
    }, [selectedChatId, messagesList]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // Filter messages based on search and filter type
    const filteredMessages = useMemo(() => {
        let filtered = messagesList;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(
                (msg) =>
                    msg.user1name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    msg.preview.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply read/unread filter
        if (filterType === "unread") {
            filtered = filtered.filter((msg) => msg.unread);
        } else if (filterType === "read") {
            filtered = filtered.filter((msg) => !msg.unread);
        }

        return filtered;
    }, [messagesList, searchQuery, filterType]);

    // Mark messages as read when chat is selected
    useEffect(() => {
        if (selectedChat) {
            const updatedList = messagesList.map((msg) =>
                msg._id === selectedChat._id ? { ...msg, unread: false } : msg
            );
            setMessagesList(updatedList);
            if (onMessagesListUpdate) {
                onMessagesListUpdate(updatedList);
            }
            if (onChatSelect) {
                onChatSelect(selectedChat);
            }
        }
    }, []);

    // Track previous message count to only scroll on new messages, not reactions
    const prevMessageCountRef = useRef(chatMessages.length);
    const prevSelectedChatRef = useRef<ChatMessage | null>(null);
    const isInitialLoadRef = useRef(false);
    
    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    
    // Reset scroll tracking when chat changes
    useEffect(() => {
        if (selectedChat?._id !== prevSelectedChatRef.current?._id) {
            // Chat changed, reset the message count tracking
            prevMessageCountRef.current = chatMessages.length;
            prevSelectedChatRef.current = selectedChat;
            isInitialLoadRef.current = true;
            // Don't auto-scroll when selecting a chat - let user see the conversation from the start
            // If you want to scroll to bottom on chat selection, uncomment the line below
            // setTimeout(() => {
            //     messageEndRef.current?.scrollIntoView({ behavior: "auto" });
            // }, 100);
            // Reset the flag after a short delay
            setTimeout(() => {
                isInitialLoadRef.current = false;
            }, 200);
        }
    }, [selectedChat?._id]);
    
     // Scroll to bottom when new messages arrive (not when reactions are added or chat is first loaded)
    useEffect(() => {
        if (isInitialLoadRef.current) {
            return; // Don't scroll on initial load
        }
        const currentMessageCount = chatMessages.length;
        if (currentMessageCount > prevMessageCountRef.current) {
            // Only scroll if a new message was added (not just loading existing messages)
            setTimeout(() => {
                if (messageEndRef.current) {
                    const scrollArea = messageEndRef.current.closest('[data-radix-scroll-area-viewport]');
                    if (scrollArea) {
                        scrollArea.scrollTo({
                            top: scrollArea.scrollHeight,
                            behavior: "smooth"
                        });
                    }
                }
            }, 100);
        }
        prevMessageCountRef.current = currentMessageCount;
    }, [chatMessages.length]);


    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node)
            ) {
                const target = event.target as HTMLElement;
                // Don't close if clicking on a message
                if (!target.closest('[data-message-id]')) {
                    setShowEmojiPicker(false);
                    setEmojiPickerPosition(null);
                    setSelectedMessageId(null);
                }
            }
        };

        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showEmojiPicker]);

    const handleSend = async () => {
        // Check if we have content to send
        const hasContent = messageText.trim() || attachments.length > 0;
        
        if (hasContent && onSendMessage) {
            const messageTextToSend = messageText.trim();
            const attachmentsToSend = attachments.length > 0 ? attachments : undefined;
            
            // Clear input immediately for better UX
            setMessageText("");
            setAttachments([]);
            setAttachmentPreviews([]);
            
            try {
                // Call the parent handler (which may be async)
                await Promise.resolve(onSendMessage(messageTextToSend, attachmentsToSend));
            } catch (error) {
                console.error('Error sending message:', error);
                // Restore input on error
                setMessageText(messageTextToSend);
                if (attachmentsToSend) {
                    setAttachments(attachmentsToSend);
                }
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const files = Array.from(e.target.files);
            const newAttachments = [...attachments, ...files];
            setAttachments(newAttachments);

            // Create previews for images
            const newPreviews: string[] = [];
            files.forEach((file) => {
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            newPreviews.push(e.target.result as string);
                            setAttachmentPreviews((prev) => [...prev, ...newPreviews]);
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    newPreviews.push("");
                }
            });
        }
        // Reset input to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
        setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleEmojiClick = async (emoji: string, groupId?: number, messageIndex?: number) => {
        if (groupId !== undefined && messageIndex !== undefined) {
            // Add reaction to message (WhatsApp style)
            const updatedMessages = chatMessages.map((group) => {
                if ((group.id || group._id) === groupId) {
                    const currentReactions = group.reactions || [];
                    const existingReaction = currentReactions.find((r) => r.emoji === emoji);
                    
                    if (existingReaction) {
                        // Increment count if reaction exists
                        return {
                            ...group,
                            reactions: currentReactions.map((r) =>
                                r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                            ),
                        };
                    } else {
                        // Add new reaction
                        return {
                            ...group,
                            reactions: [...currentReactions, { emoji, count: 1 }],
                        };
                    }
                }
                return group;
            });
            setChatMessages(updatedMessages);
            if (onMessageUpdate) {
                onMessageUpdate(updatedMessages);
            }

            // Persist reaction to backend (groupId is the message index in backend)
            if (selectedChatId && groupId !== undefined) {
                try {
                    const updatedGroup = updatedMessages.find((g) => (g.id || g._id) === groupId);
                    if (updatedGroup?.reactions) {
                        await updateMessageReaction(selectedChatId, groupId, updatedGroup.reactions);
                    }
                } catch (error) {
                    console.error('Failed to persist reaction:', error);
                }
            }
        } else {
            // Add emoji to input field
            setMessageText((prev) => prev + emoji);
        }
        setShowEmojiPicker(false);
        setShowAllEmojis(false);
        setEmojiPickerPosition(null);
        setSelectedMessageId(null);
    };

    const handleMessageClick = (e: React.MouseEvent<HTMLDivElement>, groupId: number, messageIndex: number) => {
        const messageElement = e.currentTarget;
        const rect = messageElement.getBoundingClientRect();
        const messageId = `${groupId}-${messageIndex}`;
        
        if (showEmojiPicker && selectedMessageId === messageId) {
            setShowEmojiPicker(false);
            setShowAllEmojis(false);
            setEmojiPickerPosition(null);
            setSelectedMessageId(null);
        } else {
            setSelectedMessageId(messageId);
            setShowAllEmojis(false);
            setEmojiPickerPosition({
                top: rect.bottom + 8,
                left: rect.left,
                messageId: messageId,
            });
            setShowEmojiPicker(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            // Prevent any file input from opening
            if (fileInputRef.current) {
                fileInputRef.current.blur();
            }
            // Always try to send if there's content (text or attachments)
            handleSend();
        }
    }; 

    const timeAgo = (dateString: string): string => {
        const now = new Date();
        const past = new Date(dateString);

        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 0) return "just now";
        // if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hr ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1); // force re-render
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, []);

    const leftAndRight = (usertype: string): string => {
        switch(usertype){
        case "user1":
            return "user1";
        default:
            return "user2";
        }
    };

    const unreadCount = messagesList.filter((m) => userType == 'user1'?m.user1read:m.user2read).length;

    return (
        <div className="dark:dark-color h-screen bg-white overflow-x-hidden pt-[64px] max-lg:pt-0 md:pt-[85px]">
            <div className="font-sans h-[calc(100vh-60px)] md:h-[calc(100vh-112px)] flex">
                {/* Chat List */}
                <div className="w-full md:w-1/3 bg-white border-r flex flex-col border-t">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-2xl font-semibold text-black dark:text-white">Chats</h2>
                        <div className="border rounded-full w-12 h-12 flex items-center justify-center">
                            <MdEmail />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto  pt-6 scrollbar-hide">
                        {filteredMessages.length > 0 ? (
                            filteredMessages.map((contact) => (
                            <div
                                key={contact._id}
                                onClick={() => {
                                    setSelectedChat(contact);
                                    if (onChatSelect) {
                                        onChatSelect(contact);
                                    }
                                }}
                                className={`flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 
                                    ${contact.isActive
                                    ? "bg-gray-200 dark:bg-blue-300 text-black"
                                    : "hover:bg-gray-200 hover:text-black"
                                }`} 
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div className="relative">
                                    <img
                                        src={API_BASE_MEDIAURL+contact.avatar}
                                        alt={contact.user2name}
                                        className="rounded-full w-12 h-10 max-md:w-14 max-md:h-14"
                                    />
                                    {contact.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                    </div>
                                    <div className="flex justify-between w-full">
                                    <div>
                                        <p className="font-medium text-sm">{contact.user2name}</p>
                                        <p className="text-xs text-gray-500">{contact.preview}</p>
                                    </div>
                                    <span className="text-xs text-gray-800">
                                        {contact.isOnline ? "Online" : contact.lastSeen}
                                    </span>
                                    </div>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <p className="[font-family:'Poppins',Helvetica] font-normal text-gray-500 text-sm">
                                    No messages found
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 flex flex-col bg-gray-50 w-full border-t relative">
                    {/* Chat messages */}
                    {selectedChat && (
                        <>
                            <div className="w-full flex justify-between items-center p-4 border-b bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                        <button
                                            className="lg:hidden text-black dark:text-white px-4"
                                        >
                                            <MdExpandLess className="rotate-[-90deg] text-2xl" />
                                        </button>
                                        )}
                                        <img src={selectedChat.avatar} alt="" className="rounded-full w-10 h-10" />
                                        <div>
                                            <h3 className="font-semibold text-xl">{selectedChat.user2name}</h3>
                                            <span className="text-sm text-gray-400">
                                                {selectedChat.isOnline ? "Online" : selectedChat.lastSeen}
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
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto space-y-4"
                                style={{
                                backgroundImage: chatWallpaper ? `url(${chatWallpaper})` : "none",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                }}
                            >
                                {chatMessages.map((group, idx) => (
                                    <div key={idx} className={`relative flex items-end gap-2 group ${group.me ? "justify-end" : "justify-start"}`}>
                                        {!group.me && (
                                            <img 
                                                src={selectedChat.avatar} 
                                                alt={selectedChat.user2name} 
                                                className="w-8 h-8 rounded-full mb-1"
                                            />
                                        )}
                                        <div 
                                            className={`max-w-[350px] h-full p-3 px-5 rounded-[10px] ${
                                                group.me 
                                                ? "bg-black text-white" 
                                                : "bg-[#f3f4f6] text-black"
                                            }`}
                                        >
                                            {/* Attachments Grid */}
                                            {group.attachments && group.attachments.length > 0 && (
                                                <div className={`grid gap-1 mb-2 ${group.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                {group.attachments.map((att, i) => (
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
                                            {group.message && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{group.message}</p>}
                                        </div>
                                        {group.me && (
                                            <img 
                                            src={getImageUrl(currentUser?.photo)} 
                                            alt="Me" 
                                            className="w-8 h-8 rounded-full mb-1 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                            }}
                                            />
                                        )}
                                        <div className={`absolute -bottom-8 ${group.me ? "right-10" : "left-10"} hidden group-hover:flex gap-1 bg-white shadow-sm border p-1 rounded-[10px] z-10`}>
                                            <button onClick={() => console.log("copy")} className="p-1 hover:bg-gray-50 rounded text-gray-500"><FiCopy size={12} /></button>
                                            <button onClick={() => console.log("delete")} className="p-1 hover:bg-gray-50 rounded text-red-400"><FiTrash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
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
                    </div>
                        </>
                    )}
                {/* {/* Empty State /} */}
                {!selectedChat && (
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
            </div>
        </div>
    );
};
