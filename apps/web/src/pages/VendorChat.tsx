import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND_VARS, BTN_PRIMARY, CONTROL, EmptyState, PANEL } from "@/components/shared";
import { getInitials } from "@/utils/getInitials";
import { cn } from "@/lib/utils";
import {
  useVendorChat,
  type ChatMessage,
  type Conversation,
  type PendingFile,
} from "@/hooks/useVendorChat";

/* ── Time helpers ─────────────────────────────────────────────────────────── */

const clockTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const relative = (d: Date) => {
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const dayLabel = (d: Date) => {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime();
  const t = d.getTime();
  if (t >= start) return "Today";
  if (t >= start - 86_400_000) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Messages grouped under a day heading, the way every chat client does it. */
const groupByDay = (messages: ChatMessage[]) => {
  const groups: { key: string; label: string; items: ChatMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(m.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ key: `${label}-${groups.length}`, label, items: [m] });
  }
  return groups;
};

/* ── Conversation row ─────────────────────────────────────────────────────── */

const ConversationRow = ({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-current={active ? "true" : undefined}
    className={cn(
      "w-full flex items-start gap-3 px-4 py-3 text-left outline-none",
      "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
      active ? "bg-brand/[0.07]" : "hover:bg-muted/60 dark:hover:bg-white/[0.03]",
    )}
  >
    {active && (
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand"
      />
    )}
    {conversation.avatar ? (
      <img
        src={conversation.avatar}
        alt=""
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    ) : (
      <span className="grid place-items-center w-10 h-10 rounded-full bg-brand/[0.12] text-brand text-[12.5px] font-bold shrink-0">
        {getInitials(conversation.name)}
      </span>
    )}

    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "text-[13.5px] truncate",
            conversation.unread > 0
              ? "font-bold text-foreground"
              : "font-semibold text-foreground/85",
          )}
        >
          {conversation.name}
        </span>
        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {relative(conversation.lastActivity)}
        </span>
      </span>
      <span className="mt-0.5 flex items-center gap-2">
        <span
          className={cn(
            "text-[12.5px] truncate",
            conversation.unread > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground",
          )}
        >
          {conversation.preview}
        </span>
        {conversation.unread > 0 && (
          <span className="ml-auto shrink-0 grid place-items-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand text-brand-fg text-[10.5px] font-bold tabular-nums">
            {conversation.unread > 99 ? "99+" : conversation.unread}
          </span>
        )}
      </span>
    </span>
  </button>
);

/* ── Message bubble ───────────────────────────────────────────────────────── */

const Bubble = ({ message, onCopy }: { message: ChatMessage; onCopy: () => void }) => {
  const mine = message.mine;
  const copyBtn = message.text ? (
    <button
      type="button"
      onClick={onCopy}
      aria-label="Copy message"
      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 grid place-items-center w-7 h-7 rounded-lg text-muted-foreground hover:bg-muted transition-opacity duration-150"
    >
      <Copy size={13} />
    </button>
  ) : null;

  return (
    <div className={cn("group flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {mine && copyBtn}

      <div
        className={cn(
          "max-w-[min(78%,520px)] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
          mine
            ? "bg-brand text-brand-fg rounded-2xl rounded-br-md"
            : "bg-muted text-foreground rounded-2xl rounded-bl-md dark:bg-white/[0.06]",
          message.failed && "ring-1 ring-red-400",
        )}
      >
        {message.attachments?.length ? (
          <div
            className={cn(
              "grid gap-1.5 mb-1.5",
              message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {message.attachments.map((a, i) =>
              a.type === "image" ? (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={a.url}
                    alt={a.name || "Attachment"}
                    className="w-full max-h-[220px] object-cover rounded-xl"
                  />
                </a>
              ) : (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold",
                    mine ? "bg-white/15" : "bg-card",
                  )}
                >
                  <FileText size={14} className="shrink-0" />
                  <span className="truncate">{a.name || "Document"}</span>
                </a>
              ),
            )}
          </div>
        ) : null}

        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

        <p
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10.5px] tabular-nums",
            mine ? "text-brand-fg/70" : "text-muted-foreground",
          )}
        >
          {message.failed ? (
            <span className={cn("font-semibold", mine ? "text-white" : "text-red-600")}>
              Not sent
            </span>
          ) : (
            <>
              {clockTime(message.at)}
              {mine &&
                (message.pending ? (
                  <Check size={11} strokeWidth={2.6} />
                ) : (
                  <CheckCheck size={11} strokeWidth={2.6} />
                ))}
            </>
          )}
        </p>
      </div>

      {!mine && copyBtn}
    </div>
  );
};

const MENU_ITEM =
  "cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold " +
  "focus:bg-brand/[0.1] focus:text-brand data-[highlighted]:bg-brand/[0.1] data-[highlighted]:text-brand";

/* ── Page ─────────────────────────────────────────────────────────────────── */

/**
 * Messages — the vendor console chat at /vendor-chat (and /dashchat).
 *
 * Used to be a re-export of ChatPage, which renders its OWN <Sidebar/> and
 * fixed `h-screen` layout. That page also sits inside DashboardLayoutShell, so
 * the console drew two sidebars and clipped the thread. This is a first-class
 * console page: two panes inside the shell, each scrolling on its own, with the
 * data/socket work in `useVendorChat`. ChatPage stays as the PUBLIC user-side
 * chat at /chat, where the navy site chrome is correct.
 */
const VendorChat = () => {
  const {
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
    refresh,
  } = useVendorChat();

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: messages.length > 1 ? "smooth" : "auto" });
  }, [messages]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const groups = useMemo(() => groupByDay(messages), [messages]);

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const picked = Array.from(e.target.files || []).map((file) => ({
      file,
      type,
      preview: type === "image" ? URL.createObjectURL(file) : null,
    }));
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    // Clear so re-picking the same file still fires onChange.
    e.target.value = "";
  };

  const submit = async () => {
    if (!draft.trim() && files.length === 0) return;
    const text = draft;
    const attachments = files;
    setDraft("");
    setFiles([]);
    const ok = await sendMessage(text, attachments);
    if (!ok) {
      toast.error("Message not sent. Check your connection and try again.");
      setDraft(text);
    }
    composerRef.current?.focus();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied");
  };

  return (
    <DashboardLayout
      title="Messages"
      contentClassName="flex-1 min-h-0 flex flex-col overflow-hidden p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* The two panes own their scrolling — the page itself never scrolls, so
          the composer stays put like a real chat client. */}
      <div
        style={BRAND_VARS}
        className="flex-1 min-h-0 w-full max-w-6xl mx-auto grid gap-4 lg:gap-5 lg:grid-cols-[320px_minmax(0,1fr)]"
      >
        {/* ── Conversation list ── */}
        <section
          className={cn(
            PANEL,
            "min-h-0 flex flex-col overflow-hidden",
            // On phones the thread replaces the list rather than stacking.
            activeId && "hidden lg:flex",
          )}
        >
          <header className="shrink-0 px-4 pt-4 pb-3 border-b border-border/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[14.5px] font-bold tracking-[-0.01em] text-foreground">
                  Conversations
                </h2>
                {totalUnread > 0 && (
                  <span className="grid place-items-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-brand/15 text-brand text-[10.5px] font-bold tabular-nums">
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => refresh()}
                aria-label="Refresh conversations"
                className="grid place-items-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
              >
                <RefreshCw size={14} strokeWidth={2.2} />
              </button>
            </div>

            <div className="relative mt-3">
              <Search
                size={14}
                strokeWidth={2.2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guests"
                aria-label="Search conversations"
                className={cn("h-9 pl-9", CONTROL)}
              />
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            {loadingList ? (
              <div className="divide-y divide-border/70">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                      <div className="h-2.5 w-3/4 rounded bg-muted/70 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={AlertCircle}
                title="We couldn't load your chats"
                description={error}
                actionLabel="Try again"
                onAction={() => refresh()}
              />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No conversations yet"
                description="When a guest messages you about a listing, the thread shows up here."
              />
            ) : visible.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-muted-foreground">
                  Nothing matches “{search.trim()}”.
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-[12.5px] font-semibold text-brand hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {visible.map((c) => (
                  <li key={c.id} className="relative">
                    <ConversationRow
                      conversation={c}
                      active={c.id === activeId}
                      onSelect={() => openConversation(c.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Thread ── */}
        <section
          className={cn(
            PANEL,
            "min-h-0 flex flex-col overflow-hidden",
            !activeId && "hidden lg:flex",
          )}
        >
          {!active ? (
            <div className="flex-1 grid place-items-center p-8 text-center">
              <div className="max-w-xs">
                <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-brand/[0.1] text-brand">
                  <MessageSquare size={24} strokeWidth={1.9} />
                </span>
                <p className="mt-4 text-[14.5px] font-bold text-foreground">Pick a conversation</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Choose a guest on the left to read the thread and reply.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/70">
                <button
                  type="button"
                  onClick={closeConversation}
                  aria-label="Back to conversations"
                  className="lg:hidden grid place-items-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors duration-150"
                >
                  <ArrowLeft size={16} strokeWidth={2.3} />
                </button>

                {active.avatar ? (
                  <img src={active.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-brand/[0.12] text-brand text-[12px] font-bold">
                    {getInitials(active.name)}
                  </span>
                )}

                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-foreground truncate">{active.name}</p>
                  {active.email && (
                    <p className="text-[11.5px] text-muted-foreground truncate">{active.email}</p>
                  )}
                </div>

                <span className="ml-auto shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                  {messages.length} message{messages.length === 1 ? "" : "s"}
                </span>
              </header>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
                {loadingThread ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "h-12 rounded-2xl bg-muted animate-pulse",
                            i % 2 ? "w-1/2" : "w-2/3",
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full grid place-items-center text-center">
                    <p className="text-[12.5px] text-muted-foreground">
                      No messages yet — say hello.
                    </p>
                  </div>
                ) : (
                  groups.map((g) => (
                    <div key={g.key} className="space-y-2.5">
                      <div className="flex items-center justify-center">
                        <span className="px-2.5 py-1 rounded-full bg-muted/70 dark:bg-white/[0.05] text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                          {g.label}
                        </span>
                      </div>
                      {g.items.map((m, i) => (
                        <motion.div
                          key={m.id ?? `${g.key}-${i}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <Bubble message={m} onCopy={() => copy(m.text)} />
                        </motion.div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <footer className="shrink-0 border-t border-border/70 bg-muted/40 dark:bg-white/[0.02] px-3 py-3">
                <AnimatePresence initial={false}>
                  {files.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pb-2.5">
                        {files.map((f, i) => (
                          <span
                            key={`${f.file.name}-${i}`}
                            className="relative inline-flex items-center gap-2 pl-2 pr-7 py-1.5 rounded-xl bg-card border border-border/70 text-[12px] font-medium text-foreground/85 max-w-[220px]"
                          >
                            {f.preview ? (
                              <img
                                src={f.preview}
                                alt=""
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                            ) : (
                              <FileText size={14} className="text-muted-foreground" />
                            )}
                            <span className="truncate">{f.file.name}</span>
                            <button
                              type="button"
                              onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))}
                              aria-label={`Remove ${f.file.name}`}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded-md text-muted-foreground hover:bg-muted"
                            >
                              <X size={11} strokeWidth={2.6} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Attach a file"
                        className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-card border border-border/70 text-muted-foreground hover:text-brand hover:border-brand/40 transition-colors duration-150"
                      >
                        <Paperclip size={16} strokeWidth={2.2} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" style={BRAND_VARS} className="w-44 p-1.5">
                      <DropdownMenuItem
                        className={MENU_ITEM}
                        onClick={() => imageInput.current?.click()}
                      >
                        <ImageIcon size={14} /> Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={MENU_ITEM}
                        onClick={() => docInput.current?.click()}
                      >
                        <FileText size={14} /> Document
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <input
                    ref={imageInput}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => pickFiles(e, "image")}
                  />
                  <input
                    ref={docInput}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    multiple
                    className="hidden"
                    onChange={(e) => pickFiles(e, "document")}
                  />

                  <textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter sends; Shift+Enter is a newline — chat convention.
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    rows={1}
                    placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
                    aria-label="Message"
                    className={cn(
                      "flex-1 min-h-[40px] max-h-[140px] resize-none py-2.5 px-3.5 border",
                      CONTROL,
                    )}
                  />

                  <Button
                    onClick={submit}
                    disabled={sending || (!draft.trim() && files.length === 0)}
                    aria-label="Send message"
                    className={cn(
                      BTN_PRIMARY,
                      "h-10 w-10 p-0 shrink-0 rounded-xl disabled:opacity-45 disabled:shadow-none",
                    )}
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} strokeWidth={2.3} />
                    )}
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default VendorChat;
