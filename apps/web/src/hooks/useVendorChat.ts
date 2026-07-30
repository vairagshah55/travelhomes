import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Chat engine for the vendor console (/vendor-chat).
 *
 * Owns the whole conversation lifecycle so the page stays presentational:
 * identity → conversation list → messages → send → live updates.
 *
 * Three things the old ChatPage got wrong, fixed here:
 *  - REST calls go to RELATIVE `/api/...` paths, so Vite's dev proxy and the
 *    deployed same-origin/`VITE_API_BASE_URL` setup both work without the page
 *    hardcoding a port (the old default was :3000 while the server runs :3001).
 *  - The socket is created per mount and torn down on unmount, and re-joins its
 *    rooms on every `connect` — a dropped connection used to silently stop
 *    delivering messages until a full reload.
 *  - Opening a conversation calls `mark-read`, so the server's unread counter
 *    actually clears. The list also reads `unreadCounts[myId]`; the old code
 *    read a non-existent `unreadCount` field, so badges never appeared.
 */

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || undefined; // undefined → same origin

export type ChatAttachment = {
  type: "image" | "document";
  url: string;
  name?: string;
};

export type ChatMessage = {
  id?: string;
  text: string;
  at: Date;
  mine: boolean;
  senderName?: string;
  attachments?: ChatAttachment[];
  /** Set while an optimistic message is still in flight. */
  pending?: boolean;
  failed?: boolean;
};

export type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  preview: string;
  lastActivity: Date;
  unread: number;
  /** The other side of the conversation, for socket targeting. */
  peerId?: string;
  peerKind?: string;
};

export type PendingFile = {
  file: File;
  type: "image" | "document";
  preview: string | null;
};

type Profile = { id: string; name: string; photo?: string; type: "Vendor" | "User" };

const MEDIA_BASE =
  import.meta.env.VITE_API_BASE_URL_MEDIA || import.meta.env.VITE_API_BASE_URL || "";

const absolute = (url?: string) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${MEDIA_BASE}${url}`;
};

const mapAttachments = (raw: any[] | undefined): ChatAttachment[] | undefined =>
  raw?.length
    ? raw.map((a) => ({
        type: a.mimetype?.startsWith("image/") || a.type === "image" ? "image" : "document",
        url: absolute(a.url),
        name: a.filename || a.name,
      }))
    : undefined;

const previewOf = (text?: string, attachments?: any[]) => {
  if (text?.trim()) return text.trim();
  if (attachments?.length) {
    const first = mapAttachments(attachments)?.[0];
    return first?.type === "image" ? "Photo" : "Attachment";
  }
  return "No messages yet";
};

const asDate = (v: any) => {
  const d = v ? new Date(v) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

export const useVendorChat = () => {
  const { user } = useAuth();
  const isVendor = user?.userType === "vendor";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  // Read inside socket handlers, which must not re-bind on every state change.
  const activeIdRef = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const roomsRef = useRef<string[]>([]);

  activeIdRef.current = activeId;
  profileRef.current = profile;

  /* ── Identity ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/vendorchats/profile?email=${encodeURIComponent(user.email)}&type=${
            isVendor ? "vendor" : "user"
          }`,
        );
        const json = await res.json();
        if (cancelled) return;
        if (json?.success && json.data?.id) {
          setProfile(json.data);
        } else {
          setError("We couldn't load your chat profile.");
          setLoadingList(false);
        }
      } catch {
        if (!cancelled) {
          setError("We couldn't load your chat profile.");
          setLoadingList(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email, isVendor]);

  /* ── Conversation list ────────────────────────────────────────────────── */
  const loadConversations = useCallback(async () => {
    const me = profileRef.current;
    if (!me?.id) return;
    try {
      const res = await fetch(
        `/api/vendorchats/conversations?participantKind=${me.type}&participantId=${me.id}`,
      );
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed");

      const mapped: Conversation[] = (json.data || []).map((c: any) => {
        const peer = (c.participants || []).find((p: any) => {
          const pid = p.refId?._id || p.refId;
          return String(pid) !== String(me.id);
        });
        const peerDoc = peer?.refId || {};
        return {
          id: c._id,
          name: peerDoc.name || peerDoc.brandName || peerDoc.personName || peerDoc.email || "Guest",
          avatar: absolute(peerDoc.photo),
          email: peerDoc.email,
          preview: c.lastMessage || "No messages yet",
          lastActivity: asDate(c.lastActivity || c.updatedAt || c.createdAt),
          // The server stores a per-participant map; the old client read a
          // flat `unreadCount` that the API never returns.
          unread: Number(c.unreadCounts?.[String(me.id)] || 0),
          peerId: peerDoc._id ? String(peerDoc._id) : peer?.refId ? String(peer.refId) : undefined,
          peerKind: peer?.kind,
        };
      });

      mapped.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      setConversations(mapped);
      setError(null);

      // Background rooms so a message lands even when its thread isn't open.
      roomsRef.current = mapped.map((c) => c.id);
      socketRef.current?.emit("join_all_user_rooms", roomsRef.current);
    } catch {
      setError("We couldn't load your conversations.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.id) loadConversations();
  }, [profile?.id, loadConversations]);

  /* ── Read state ───────────────────────────────────────────────────────── */
  const markRead = useCallback(async (conversationId: string) => {
    const me = profileRef.current;
    if (!me?.id || !conversationId) return;
    try {
      await fetch(`/api/vendorchats/conversations/${conversationId}/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: me.id }),
      });
    } catch {
      /* best effort — the badge clears locally either way */
    }
  }, []);

  /* ── Socket ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!profile?.id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    /** Rooms are per-connection, so (re)join on every connect, not once. */
    const joinRooms = () => {
      socket.emit("join_identity", profile.id);
      if (roomsRef.current.length) socket.emit("join_all_user_rooms", roomsRef.current);
      if (activeIdRef.current) socket.emit("join_chat", activeIdRef.current);
    };

    socket.on("connect", joinRooms);

    socket.on("receive_message", (data: any) => {
      const me = profileRef.current;
      const mine = String(data.senderId) === String(me?.id);
      const convId = String(data.chatId || "");

      // Someone messaged a conversation we don't have yet.
      if (convId && !roomsRef.current.includes(convId)) {
        loadConversations();
        return;
      }

      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === convId
              ? {
                  ...c,
                  preview: previewOf(data.content, data.attachments),
                  lastActivity: new Date(),
                  unread: mine || activeIdRef.current === convId ? c.unread : c.unread + 1,
                }
              : c,
          )
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()),
      );

      // Our own echo is already on screen from the optimistic append.
      if (mine || activeIdRef.current !== convId) return;

      setMessages((prev) => [
        ...prev,
        {
          id: data.id || data._id,
          text: data.content || "",
          at: new Date(),
          mine: false,
          attachments: mapAttachments(data.attachments),
        },
      ]);
      // We're looking at it, so keep the server's counter at zero.
      void markRead(convId);
    });

    return () => {
      socket.off("connect", joinRooms);
      socket.off("receive_message");
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, loadConversations]);

  /* ── Thread ───────────────────────────────────────────────────────────── */
  const openConversation = useCallback(
    async (conversationId: string) => {
      const me = profileRef.current;
      setActiveId(conversationId);
      setMessages([]);
      if (!me?.id) return;

      socketRef.current?.emit("join_chat", conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      );

      setLoadingThread(true);
      try {
        const res = await fetch(
          `/api/vendorchats/conversations/${conversationId}/messages?limit=100`,
        );
        const json = await res.json();
        if (!json?.success) throw new Error(json?.message || "Failed");
        setMessages(
          (json.data || []).map((m: any) => ({
            id: m._id,
            text: m.content || "",
            at: asDate(m.timestamp || m.createdAt),
            mine: String(m.senderId?._id || m.senderId) === String(me.id),
            senderName: m.senderId?.name,
            attachments: mapAttachments(m.attachments),
          })),
        );
        void markRead(conversationId);
      } catch {
        setError("We couldn't load this conversation.");
      } finally {
        setLoadingThread(false);
      }
    },
    [markRead],
  );

  const closeConversation = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  /* ── Send ─────────────────────────────────────────────────────────────── */
  const sendMessage = useCallback(
    async (text: string, files: PendingFile[] = []) => {
      const me = profileRef.current;
      const conversationId = activeIdRef.current;
      const body = text.trim();
      if (!me?.id || !conversationId || (!body && files.length === 0)) return false;

      const stamp = Date.now();
      const optimistic: ChatMessage = {
        id: `pending-${stamp}`,
        text: body,
        at: new Date(),
        mine: true,
        pending: true,
        attachments: files.length
          ? files.map((f) => ({
              type: f.type,
              url: f.preview || "",
              name: f.file.name,
            }))
          : undefined,
      };
      setMessages((prev) => [...prev, optimistic]);
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === conversationId
              ? { ...c, preview: body || "Attachment", lastActivity: new Date() }
              : c,
          )
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()),
      );
      setSending(true);

      try {
        let attachments: any[] = [];
        if (files.length) {
          const formData = new FormData();
          files.forEach((f) => formData.append("files", f.file));
          const upRes = await fetch("/api/vendorchats/upload", { method: "POST", body: formData });
          const upJson = await upRes.json();
          if (!upJson?.success) throw new Error("Upload failed");
          attachments = upJson.data || [];
        }

        const res = await fetch(`/api/vendorchats/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderKind: me.type,
            senderId: me.id,
            content: body,
            attachments,
          }),
        });
        const json = await res.json();
        if (!json?.success) throw new Error(json?.message || "Send failed");

        // Swap the optimistic row for the saved one (real id + stored URLs).
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id
              ? {
                  id: json.data?._id,
                  text: body,
                  at: asDate(json.data?.timestamp || json.data?.createdAt),
                  mine: true,
                  attachments: mapAttachments(json.data?.attachments || attachments),
                }
              : m,
          ),
        );

        const peer = conversations.find((c) => c.id === conversationId)?.peerId;
        socketRef.current?.emit("send_message", {
          chatId: conversationId,
          senderKind: me.type,
          senderId: me.id,
          content: body,
          attachments,
          recipientId: peer,
        });
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false, failed: true } : m)),
        );
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversations],
  );

  /** Drop a failed message and put its text back in the composer's hands. */
  const discardMessage = useCallback((id?: string) => {
    if (!id) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread, 0),
    [conversations],
  );

  return {
    profile,
    conversations,
    active,
    activeId,
    messages,
    loadingList,
    loadingThread,
    sending,
    error,
    totalUnread,
    openConversation,
    closeConversation,
    sendMessage,
    discardMessage,
    refresh: loadConversations,
  };
};

export default useVendorChat;
