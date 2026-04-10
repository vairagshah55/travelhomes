import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
import Header, { DashboardHeader } from "@/components/Header";
import {
  Bell,
  LinkIcon,
  MessageCircle,
  MessageCircleIcon,
  SendIcon,
} from "lucide-react";
import MobileUserNav from "@/components/MobileUserNav";
import { Sidebar } from "@/components/Navigation";
import ProfileDropdown from "@/components/ProfileDropdown";

import { ThemeToggle } from "@/components/ThemeToggle";

// Initial chat data
const initialChatUsers = [
  {
    id: 1,
    name: "Akash Retail",
    type: "Direct",
    lastSeen: "2m ago",
    preview: "Interested in bulk order of So...",
    avatar: "https://i.pravatar.cc/40?img=1",
    isOnline: true,
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
    isOnline: true,
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
    members: [1, 2, 3],
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

const DashboardChat = () => {
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  const handleSwitchToUser = () => {
    navigate("/user-profile"); // Navigate to user dashboard
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      setNewMessage("");
    }
  };

  const chatSectionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedUser && chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSend = () => {
    if (!messageText.trim() || !selectedUser) return;

    const newMessage = {
      sender: "You",
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      me: true,
    };

    const updatedChats = chats.map((chat) =>
      chat.id === selectedUser.id
        ? {
            ...chat,
            messages: [...chat.messages, newMessage],
            preview: newMessage.text.slice(0, 30) + "...",
          }
        : chat,
    );

    setChats(updatedChats);
    setSelectedUser({
      ...selectedUser,
      messages: [...selectedUser.messages, newMessage],
    });
    setMessageText("");
    setShowEmojis(false);
    setShowPopup(false);
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
    <div className="w-full md:w-1/3 bg-white border-r flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-semibold text-black dark:text-white">
          Chats
        </h2>
        <div className="border rounded-full w-12 h-12 flex items-center justify-center">
          <MdEmail />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto   pt-6 scrollbar-hide">
        {chats
          .filter(
            (user) =>
              user.type === filter &&
              user.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <div className="flex-1 flex flex-col bg-gray-50 w-full">
      {selectedUser ? (
        <>
          <div className="w-full flex overflow-hidden justify-between items-center p-4 border-b bg-white">
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
              <img
                src={selectedUser.avatar}
                alt=""
                className="rounded-full w-10 h-10"
              />
              <div>
                <h3 className="font-semibold text-xl">{selectedUser.name}</h3>
                <span className="text-sm text-gray-400">
                  {selectedUser.isOnline ? "Online" : selectedUser.lastSeen}
                </span>
              </div>
            </div>
            <div className="relative flex items-center space-x-3">
              <button
                onClick={() =>
                  navigate("/videocall", { state: { user: selectedUser } })
                }
              >
                <FaPhoneAlt className="text-2xl" />
              </button>
              <button
                onClick={() =>
                  navigate("/videocall", { state: { user: selectedUser } })
                }
              >
                <FaVideo className="text-2xl" />
              </button>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-3xl"
              >
                ⋮
              </button>
              {showOptions && (
                <div className="absolute right-0 top-12 bg-white border rounded shadow w-48 z-50">
                  {[
                    "Label chat",
                    "View Contact",
                    "Media, Links and docs",
                    "Search",
                    "Mute notifications",
                    "Disappearing messages",
                    "Wallpaper",
                    "More",
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setShowOptions(false)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 p-4 overflow-y-auto space-y-6"
            style={{
              backgroundImage: chatWallpaper ? `url(${chatWallpaper})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {selectedUser.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`relative flex group ${msg.me ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-sm p-3 rounded-xl ${msg.me ? "bg-black text-white" : "bg-gray-100 text-gray-800 shadow"}`}
                >
                  {!msg.me && (
                    <p className="text-xs text-gray-500 mb-1">{msg.sender}</p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs mt-2 text-right">{msg.time}</p>
                </div>
                <div className="absolute top-0 right-0 mt-[-20px] hidden group-hover:flex gap-2 bg-white shadow p-2 rounded">
                  <button onClick={() => handleCopy(msg)}>
                    <FiCopy />
                  </button>
                  <button onClick={() => handleForward(msg)}>
                    <IoIosSend />
                  </button>
                  <button onClick={() => handleDeleteMessage(idx)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="text-xl"
              >
                😊
              </button>
              {showEmojis && (
                <div className="absolute bottom-14 left-0 bg-white border rounded shadow p-2 flex gap-2">
                  {["😀", "😁", "😂", "😍", "👍"].map((emoji) => (
                    <button
                      key={emoji}
                      className="text-2xl"
                      onClick={() => {
                        setMessageText((prev) => prev + emoji);
                        setShowEmojis(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message..."
              className="dark:dark-color dark:text-black dark:border dark:border-gray-600 rounded-xl flex-1 px-4 py-2 outline-none text-sm resize-none"
            />

            {/* Attach */}
            <div className="dark:dark-color relative">
              <button onClick={() => setShowPopup(!showPopup)}>
                <LinkIcon />
              </button>
              {showPopup && (
                <div className="dark:dark-color absolute bottom-14 right-0 bg-white border rounded shadow p-4 w-48 flex flex-col gap-3 z-50">
                  {/* Document */}
                  <input
                    type="file"
                    id="docInput"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        console.log("Selected document:", file);
                      }
                    }}
                  />
                  <button
                    className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded"
                    onClick={() => document.getElementById("docInput").click()}
                  >
                    <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded">
                      <IoDocumentText />
                    </span>
                    Document
                  </button>

                  {/* Camera */}
                  <input
                    type="file"
                    id="cameraInput"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        console.log("Captured photo:", file);
                      }
                    }}
                  />
                  <button
                    className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded"
                    onClick={() =>
                      document.getElementById("cameraInput").click()
                    }
                  >
                    <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded">
                      <FaCamera />
                    </span>{" "}
                    Camera
                  </button>

                  {/* Gallery */}
                  <input
                    type="file"
                    id="galleryInput"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      console.log("Selected gallery images:", files);
                    }}
                  />
                  <button
                    className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded"
                    onClick={() =>
                      document.getElementById("galleryInput").click()
                    }
                  >
                    <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded">
                      <GrGallery />
                    </span>{" "}
                    Gallery
                  </button>

                  {/* Location */}
                  <button
                    className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded"
                    // onClick={handleGetLocation}
                  >
                    <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded">
                      <MdLocationOn />
                    </span>{" "}
                    Location
                  </button>

                  {/* Contact */}
                  <button className="flex items-center gap-2 text-sm hover:bg-gray-100 p-2 rounded">
                    <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded">
                      <RiContactsFill />
                    </span>{" "}
                    Contact
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSend}
              className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center"
            >
              <SendIcon />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-10">
          <div className="max-w-md mx-auto">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5665/5665756.png"
              alt="No Chat Selected"
              className="w-40 h-40 mx-auto mb-4 opacity-50"
            />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No conversation selected
            </h2>
            <p className="text-gray-500">
              Select a chat from the sidebar to start messaging.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col ">
          {/* Header */}
          <DashboardHeader Headtitle={"Vendor Chat"} />

          {/* Main Content Area */}
          <main className="mb-10 flex-1 flex flex-col pr-5 pb-5 overflow-y-auto scrollbar-hide">
            {/* Padding top = header height */}
            <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex">
              {isMobile ? (
                started ? (
                  <ChatPanel />
                ) : (
                  <ChatList />
                )
              ) : (
                <>
                  <ChatList />
                  <ChatPanel />
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 w-full z-50">
        <MobileUserNav />
      </div>
    </>
  );
};

export default DashboardChat;
