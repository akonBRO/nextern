'use client';

import BrandLoader from '@/components/ui/BrandLoader';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Send,
  Check,
  CheckCheck,
  Loader2,
  X,
  Forward,
  Edit2,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  CircleAlert,
  Lock,
  Search,
  MessageSquare,
  MoreHorizontal,
  ChevronDown,
  ArrowDown,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { readJsonSafely } from '@/lib/safe-json';
import useDialog from '@/components/ui/useDialog';
import './inbox.css';
import './inbox-workspace.css';

/* ─── Types ──────────────────────────────────────────────────────── */
type UserData = {
  _id: string;
  name: string;
  role: string;
  image?: string;
  companyName?: string;
};

type Message = {
  _id: string;
  senderId: string | UserData;
  receiverId: string;
  threadId: string;
  threadType?: 'direct' | 'freelance_order';
  content: string;
  isRead: boolean;
  createdAt: string;
  templateType?: string | null;
  messageType?: 'support_message' | 'admin_message' | 'system_message';
  editCount?: number;
  forwardedFromId?: string;
  isDeletedForEveryone?: boolean;
  attachments?: { url: string; name: string; type: string }[];
  relatedFreelanceOrderId?: string;
};
type Thread = {
  threadId: string;
  lastMessage: Message;
  unreadCount: number;
  threadType: 'direct' | 'freelance_order';
  otherUser: UserData;
  freelanceOrder?: {
    _id: string;
    title: string;
    status: string;
    proposalStatus: string;
  } | null;
};

function supportMessageTypeLabel(type?: Message['messageType']) {
  if (type === 'admin_message') return 'Admin Message';
  if (type === 'system_message') return 'System Message';
  if (type === 'support_message') return 'Support Message';
  return null;
}

/* ─── Colour tokens (mirrors globals.css) ────────────────────────── */
const C = {
  primary: '#087f72',
  primaryHover: '#06665d',
  cyan: '#087f72',
  deep: '#182c39',
  bg: '#f6f8f9',
  gray: '#60717d',
  success: '#10b981',
  danger: '#ef4444',
  border: '#dfe6e9',
  white: '#ffffff',
  /* gradient sent bubble */
  bubbleOut: '#087f72',
  bubbleIn: '#ffffff',
} as const;

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const fmtConversationDate = (iso: string) => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toDateString() === new Date().toDateString()
    ? fmtTime(iso)
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
const fmtMessageDate = (iso: string) => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  if (date.toDateString() === new Date().toDateString()) return 'Today';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};
const initials = (name: string) => name?.charAt(0).toUpperCase() ?? '?';
const getMessageSenderId = (message: Pick<Message, 'senderId'>) =>
  typeof message.senderId === 'string' ? message.senderId : message.senderId?._id || '';

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ user, size = 40 }: { user: UserData; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: '#e3ece0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#315d46',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {user.image ? (
        <img
          src={user.image}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials(user.name)
      )}
    </div>
  );
}

function AlertModal({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        maxWidth: 'calc(100vw - 40px)',
        zIndex: 99999,
        background: '#182c39',
        color: '#f6f8f9',
        padding: '16px 20px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircleAlert size={18} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{message}</div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          padding: 4,
          marginLeft: 8,
          display: 'flex',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function DeleteModal({
  canDeleteForEveryone,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: {
  canDeleteForEveryone: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}) {
  const dialogRef = useDialog(true, onClose);
  return (
    <div
      style={{
        position: 'fixed',
        padding: 16,
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Delete message"
        tabIndex={-1}
        className="inbox-dialog"
        style={{
          background: C.white,
          borderRadius: 12,
          width: '100%',
          maxWidth: 380,
          maxHeight: 'calc(100dvh - 32px)',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
          overflow: 'auto',
        }}
      >
        {/* Gradient Header */}
        <div
          style={{
            padding: '20px 24px',
            background: '#dc2626',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
                Delete message
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              color: '#fff',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onDeleteForMe}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 12,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.borderColor = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={17} color={C.gray} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.deep }}>Delete for me</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                Only removed from your view
              </div>
            </div>
          </button>

          {canDeleteForEveryone && (
            <button
              onClick={onDeleteForEveryone}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 12,
                border: '1.5px solid #FECACA',
                background: '#FFF5F5',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFF5F5';
                e.currentTarget.style.borderColor = '#FECACA';
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={17} color={C.danger} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.danger }}>
                  Delete for everyone
                </div>
                <div style={{ fontSize: 12, color: '#F87171', marginTop: 2 }}>
                  Removed for all (15 min limit)
                </div>
              </div>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: 'pointer',
              color: C.gray,
              fontSize: 13,
              fontWeight: 700,
              transition: 'all 0.15s',
              marginTop: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.border)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.bg)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Forward Modal ──────────────────────────────────────────────── */
function ForwardModal({
  threads,
  onForward,
  onClose,
}: {
  threads: Thread[];
  onForward: (userId: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialog(true, onClose);
  return (
    <div
      style={{
        position: 'fixed',
        padding: 16,
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Forward message"
        tabIndex={-1}
        className="inbox-dialog"
        style={{
          background: C.white,
          width: '100%',
          maxWidth: 420,
          maxHeight: 'calc(100dvh - 32px)',
          borderRadius: 12,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
          overflow: 'auto',
        }}
      >
        {/* Gradient Header */}
        <div
          style={{
            padding: '20px 24px',
            background: '#182c39',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Forward size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
                Forward message
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Choose a conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              color: '#fff',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '6px 0' }}>
          {threads.map((t) => (
            <div
              key={t.threadId}
              onClick={() => onForward(t.otherUser._id)}
              style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderBottom: `1px solid ${C.bg}`,
                borderLeft: '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.borderLeftColor = C.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.white;
                e.currentTarget.style.borderLeftColor = 'transparent';
              }}
            >
              <Avatar user={t.otherUser} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.deep, fontSize: 14 }}>
                  {t.otherUser.name}
                </div>
                <div style={{ fontSize: 12, color: C.gray, textTransform: 'capitalize' }}>
                  {t.otherUser.role === 'employer'
                    ? t.otherUser.companyName || 'Employer'
                    : t.otherUser.role}
                </div>
              </div>
              <Send size={14} color={C.gray} style={{ opacity: 0.4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function Inbox({
  currentUserId,
  currentUserRole,
  initiateUserId,
  initiateFreelanceOrderId,
}: {
  currentUserId: string;
  currentUserRole: string;
  initiateUserId?: string;
  initiateFreelanceOrderId?: string;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [conversationKind, setConversationKind] = useState<'all' | 'direct' | 'freelance_order'>(
    'all'
  );
  const [threadError, setThreadError] = useState(false);
  const [threadRetry, setThreadRetry] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageLoadError, setMessageLoadError] = useState(false);
  const [messageRetry, setMessageRetry] = useState(0);
  const [showLatest, setShowLatest] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = useState('');
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; msg: Message | null }>({
    open: false,
    msg: null,
  });
  const [forwardModal, setForwardModal] = useState<{ open: boolean; msg: Message | null }>({
    open: false,
    msg: null,
  });
  const [globalAlert, setGlobalAlert] = useState<string | null>(null);
  const [messagingLocked, setMessagingLocked] = useState(false);

  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const { startUpload, isUploading } = useUploadThing('messageAttachmentUploader', {
    onClientUploadComplete: () => {
      // success handled in send
    },
    onUploadError: (e) => {
      setGlobalAlert(`Upload failed: ${e.message}`);
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesScrollerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const draftsRef = useRef<Record<string, { text: string; files: File[]; template: string }>>({});
  const pusherRef = useRef<Pusher | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');

  function scrollToBottom() {
    const history = messagesScrollerRef.current;
    history?.scrollTo({
      top: history.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  function handleThreadSelect(thread: Thread) {
    if (selectedThread?.threadId === thread.threadId) {
      setMobilePane('chat');
      return;
    }
    if (selectedThread && !editingMsg)
      draftsRef.current[selectedThread.threadId] = { text: inputText, files: inputFiles, template };
    const draft = draftsRef.current[thread.threadId];
    setInputText(draft?.text ?? '');
    setInputFiles(draft?.files ?? []);
    setTemplate(draft?.template ?? '');
    setEditingMsg(null);
    setMessages([]);
    setMessagesLoading(true);
    setMessageLoadError(false);
    setShowLatest(false);
    setSelectedThread(thread);
    setMobilePane('chat');
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)');
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  const buildThreadsUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (initiateUserId) params.set('initiateUser', initiateUserId);
    if (initiateFreelanceOrderId) params.set('freelanceOrder', initiateFreelanceOrderId);

    const query = params.toString();
    return query ? `/api/messages?${query}` : '/api/messages';
  }, [initiateFreelanceOrderId, initiateUserId]);

  /* Refetch threads from server */
  const refetchThreads = useCallback(
    () =>
      fetch(buildThreadsUrl())
        .then((r) =>
          readJsonSafely<{ threads?: Thread[]; initiatedThreadId?: string | null }>(r, {})
        )
        .then((d) => {
          if (d.threads) setThreads(d.threads);
        }),
    [buildThreadsUrl]
  );

  /* ── Fetch Threads ──────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    fetch(buildThreadsUrl())
      .then((r) => {
        if (!r.ok) throw new Error('Conversations unavailable');
        return readJsonSafely<{ threads?: Thread[]; initiatedThreadId?: string | null }>(r, {});
      })
      .then((d) => {
        if (cancelled) return;
        if (d.threads) {
          setThreads(d.threads);
          if (initiateUserId) {
            const tgt = d.threads.find((t: Thread) => t.otherUser._id === initiateUserId);
            if (tgt) {
              setMessages([]);
              setMessagesLoading(true);
              setMessageLoadError(false);
              setSelectedThread(tgt);
              setMobilePane('chat');
            }
          } else if (initiateFreelanceOrderId) {
            const tgt =
              d.threads.find(
                (t: Thread) =>
                  t.freelanceOrder?._id === initiateFreelanceOrderId ||
                  t.threadId === d.initiatedThreadId
              ) || null;
            if (tgt) {
              setMessages([]);
              setMessagesLoading(true);
              setMessageLoadError(false);
              setSelectedThread(tgt);
              setMobilePane('chat');
            }
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setThreadError(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [buildThreadsUrl, initiateFreelanceOrderId, initiateUserId, threadRetry]);

  /* ── Check student → employer messaging eligibility ──────────── */
  useEffect(() => {
    let cancelled = false;
    const ELIGIBLE = ['shortlisted', 'assessment_sent', 'interview_scheduled', 'hired'];

    async function checkEligibility() {
      if (!selectedThread || selectedThread.threadType === 'freelance_order') {
        if (!cancelled) setMessagingLocked(false);
        return;
      }

      // 1. Student → Employer check
      if (currentUserRole === 'student' && selectedThread.otherUser.role === 'employer') {
        try {
          const res = await fetch(
            `/api/applications?employerId=${selectedThread.otherUser._id}&limit=50`
          );
          const d = await readJsonSafely<{ applications?: { status: string }[] }>(res, {});
          const apps: { status: string }[] = d.applications ?? [];
          const hasEligible = apps.some((a) => ELIGIBLE.includes(a.status));
          if (!cancelled) setMessagingLocked(!hasEligible);
        } catch {
          if (!cancelled) setMessagingLocked(false);
        }
        return;
      }

      // 2. Student ↔ Alumni (Mentor) check
      if (
        (currentUserRole === 'student' && selectedThread.otherUser.role === 'alumni') ||
        (currentUserRole === 'alumni' && selectedThread.otherUser.role === 'student')
      ) {
        try {
          // Fetch the sessions involving these two
          // For a student querying their mentor sessions, they just hit /api/mentor-sessions
          // But it's easier to fetch all sessions and filter.
          const roleParam = currentUserRole === 'alumni' ? '?role=mentor' : '';
          const res = await fetch(`/api/mentor-sessions${roleParam}`, { cache: 'no-store' });
          const d = await readJsonSafely<unknown[]>(res, []);
          const sessions = Array.isArray(d) ? d : [];

          // Check if there is an accepted or scheduled session with the other user
          const mentorIdToCheck =
            currentUserRole === 'alumni' ? currentUserId : selectedThread.otherUser._id;
          const studentIdToCheck =
            currentUserRole === 'student' ? currentUserId : selectedThread.otherUser._id;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasEligibleSession = sessions.some((s: any) => {
            const mUserId = s.mentorId?.userId;
            const mId = (mUserId?._id || mUserId || s.mentorId)?.toString();
            const stId = (s.studentId?._id || s.studentId)?.toString();

            const isMatch = mId === mentorIdToCheck && stId === studentIdToCheck;

            return isMatch && ['accepted', 'scheduled'].includes(s.status);
          });

          if (!cancelled) setMessagingLocked(!hasEligibleSession);
        } catch {
          if (!cancelled) setMessagingLocked(false);
        }
        return;
      }

      if (!cancelled) setMessagingLocked(false);
    }

    checkEligibility();
    return () => {
      cancelled = true;
    };
  }, [currentUserRole, currentUserId, selectedThread]);

  /* ── Fetch Messages for Selected Thread ─────────────────────── */
  useEffect(() => {
    if (!selectedThread) return;
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: selectedThread.threadId }),
    }).catch(() => {
      /* Reading the thread remains available if the receipt request fails. */
    });
    const prevUnread = selectedThread.unreadCount;
    if (prevUnread > 0)
      window.dispatchEvent(new CustomEvent('messages-read', { detail: { count: prevUnread } }));
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread) return;
    let cancelled = false;
    fetch(`/api/messages/${selectedThread.threadId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Messages unavailable');
        return readJsonSafely<{ messages?: Message[] }>(r, {});
      })
      .then((d) => {
        if (cancelled) return;
        setThreads((prev) =>
          prev.map((t) => (t.threadId === selectedThread.threadId ? { ...t, unreadCount: 0 } : t))
        );
        if (d.messages) {
          setMessages(d.messages);
          setTimeout(scrollToBottom, 50);
        }
      })
      .catch(() => {
        if (!cancelled) setMessageLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedThread, messageRetry]);

  /* ── Pusher ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return;
    if (!pusherRef.current)
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

    const ch = pusherRef.current.subscribe(`user-${currentUserId}`);

    ch.bind('new-message', (msg: Message) => {
      if (selectedThread && selectedThread.threadId === msg.threadId) {
        setMessages((prev) => [...prev, msg]);
        fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: msg.threadId }),
        });
        window.dispatchEvent(new Event('message-intercepted'));
        setTimeout(scrollToBottom, 100);
      } else {
        setThreads((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((t) => t.threadId === msg.threadId);
          if (idx >= 0) {
            updated[idx].lastMessage = msg;
            updated[idx].unreadCount += 1;
          } else {
            refetchThreads();
          }
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
          );
        });
      }
    });

    ch.bind('message-edited', (edited: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === edited._id ? edited : m)));
      setThreads((prev) =>
        prev.map((t) => (t.lastMessage._id === edited._id ? { ...t, lastMessage: edited } : t))
      );
    });

    ch.bind(
      'message-deleted',
      (payload: {
        messageId: string;
        forEveryone: boolean;
        content: string;
        deletedForMeBy: string | null;
      }) => {
        setMessages((prev) => {
          if (payload.forEveryone)
            return prev.map((m) =>
              m._id === payload.messageId
                ? { ...m, content: payload.content, isDeletedForEveryone: true, attachments: [] }
                : m
            );
          if (payload.deletedForMeBy === currentUserId)
            return prev.filter((m) => m._id !== payload.messageId);
          return prev;
        });
      }
    );

    ch.bind('messages-read', (payload: { threadId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.threadId === payload.threadId && !m.isRead ? { ...m, isRead: true } : m))
      );
      setThreads((prev) =>
        prev.map((t) => {
          if (t.threadId === payload.threadId && !t.lastMessage.isRead) {
            return { ...t, lastMessage: { ...t.lastMessage, isRead: true } };
          }
          return t;
        })
      );
    });

    return () => {
      pusherRef.current?.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId, refetchThreads, selectedThread]);

  const matchesSearch = (thread: Thread) =>
    `${thread.otherUser.name} ${thread.otherUser.companyName ?? ''} ${thread.freelanceOrder?.title ?? ''} ${thread.lastMessage.isDeletedForEveryone ? '' : thread.lastMessage.content}`
      .toLowerCase()
      .includes(conversationSearch.toLowerCase().trim());
  const freelanceThreads = threads.filter((thread) => thread.threadType === 'freelance_order');
  const directThreads = threads.filter((thread) => thread.threadType !== 'freelance_order');
  const selectedThreadReadOnly =
    messagingLocked ||
    (selectedThread?.threadType === 'freelance_order' &&
      !!selectedThread.freelanceOrder &&
      (selectedThread.freelanceOrder.proposalStatus !== 'accepted' ||
        ['completed', 'cancelled'].includes(selectedThread.freelanceOrder.status)));

  /* ── Send / Edit ─────────────────────────────────────────────── */
  const handleSendOrEdit = async () => {
    if ((!inputText.trim() && inputFiles.length === 0) || !selectedThread || selectedThreadReadOnly)
      return;
    setIsSending(true);

    if (editingMsg) {
      await fetch('/api/messages/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: editingMsg._id, content: inputText }),
      });
      setEditingMsg(null);
    } else {
      try {
        let uploadedAttachments: { url: string; name: string; type: string }[] = [];
        if (inputFiles.length > 0) {
          const results = await startUpload(inputFiles);
          if (results) {
            uploadedAttachments = results.map(
              (r: {
                ufsUrl?: string;
                url?: string;
                name?: string;
                type?: string;
                serverData?: Record<string, string>;
              }) => {
                const sData = r.serverData || {};
                return {
                  url: sData.ufsUrl || r.ufsUrl || r.url || '',
                  name: sData.name || r.name || 'attachment',
                  type:
                    sData.type ||
                    r.type ||
                    (r.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                };
              }
            );
          }
        }

        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: selectedThread.otherUser._id,
            threadId: selectedThread.threadId,
            threadType: selectedThread.threadType,
            relatedFreelanceOrderId: selectedThread.freelanceOrder?._id,
            content: inputText,
            templateType: template || null,
            attachments: uploadedAttachments,
          }),
        });
        const data = await readJsonSafely<{ message?: Message; error?: string }>(res, {});
        const createdMessage = data.message;

        if (createdMessage) {
          setMessages((prev) => [...prev, createdMessage]);
          setThreads((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((t) => t.threadId === selectedThread.threadId);
            if (idx >= 0) updated[idx].lastMessage = createdMessage;
            return updated.sort(
              (a, b) =>
                new Date(b.lastMessage.createdAt).getTime() -
                new Date(a.lastMessage.createdAt).getTime()
            );
          });
        } else {
          console.error('API error response', data);
          setGlobalAlert(`Send failed from API: ${data.error || 'Unknown error'}`);
        }
      } catch (e) {
        console.error('Send failed exception', e);
        setGlobalAlert(`Send failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    setInputText('');
    setTemplate('');
    setInputFiles([]);
    setIsSending(false);
    scrollToBottom();
  };

  /* ── Delete ──────────────────────────────────────────────────── */
  const handleDeleteForMe = async () => {
    if (!deleteModal.msg) return;
    await fetch(`/api/messages/manage?messageId=${deleteModal.msg._id}&forEveryone=false`, {
      method: 'DELETE',
    });
    setMessages((prev) => prev.filter((m) => m._id !== deleteModal.msg!._id));
    setDeleteModal({ open: false, msg: null });
  };
  const handleDeleteForEveryone = async () => {
    if (!deleteModal.msg) return;
    const res = await fetch(
      `/api/messages/manage?messageId=${deleteModal.msg._id}&forEveryone=true`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === deleteModal.msg!._id
            ? {
                ...m,
                content: '*This message was deleted*',
                isDeletedForEveryone: true,
                attachments: [],
              }
            : m
        )
      );
    } else {
      const d = await readJsonSafely<{ error?: string }>(res, {});
      setGlobalAlert(d.error || 'Cannot delete for everyone'); // fallback
    }
    setDeleteModal({ open: false, msg: null });
  };

  /* ── Forward ─────────────────────────────────────────────────── */
  const handleForwardExecute = async (targetUserId: string) => {
    if (!forwardModal.msg) return;
    const msg = forwardModal.msg;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: targetUserId,
        content: msg.content,
        attachments: msg.attachments,
        forwardedFromId: msg._id,
      }),
    });
    setForwardModal({ open: false, msg: null });
    // FIX #3: Refetch threads so left panel shows the forwarded message
    await refetchThreads();
  };

  /* ── Templates ───────────────────────────────────────────────── */
  const applyTemplate = (type: string) => {
    setTemplate(type);
    if (!selectedThread) return;
    const n = selectedThread.otherUser.name.split(' ')[0];
    const texts: Record<string, string> = {
      interview_invite: `Hi ${n},\n\nWe were impressed by your profile and would love to invite you for an interview. Please let us know your availability for a 30-minute video call this week.\n\nBest regards.`,
      rejection: `Hi ${n},\n\nThank you for your interest. Unfortunately, we have decided to move forward with other candidates. We wish you the best in your career.\n\nBest regards.`,
      offer_letter: `Hi ${n},\n\nCongratulations! We are thrilled to offer you a position with our team. Please review the attached details. Welcome aboard!`,
    };
    setInputText(texts[type] ?? '');
  };

  /* ── Loading ─────────────────────────────────────────────────── */
  const canSend = !selectedThreadReadOnly && (inputText.trim().length > 0 || inputFiles.length > 0);
  const showThreadList = !isMobileViewport || mobilePane === 'list' || !selectedThread;
  const showChatPanel = !isMobileViewport || (!!selectedThread && mobilePane === 'chat');
  const unreadThreads = threads.filter((thread) => thread.unreadCount > 0).length;
  const visibleThreads = threads
    .filter(matchesSearch)
    .filter(
      (thread) =>
        (conversationFilter === 'all' ||
          (conversationFilter === 'unread' ? thread.unreadCount > 0 : thread.unreadCount === 0)) &&
        (conversationKind === 'all' || thread.threadType === conversationKind)
    );

  return (
    <div
      className={[
        'messaging-workspace',
        isMobileViewport && mobilePane === 'chat' && selectedThread && 'is-chat-open',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {globalAlert && <AlertModal message={globalAlert} onClose={() => setGlobalAlert(null)} />}
      {deleteModal.open && deleteModal.msg && (
        <DeleteModal
          canDeleteForEveryone={(() => {
            const sid =
              typeof deleteModal.msg.senderId === 'string'
                ? deleteModal.msg.senderId
                : deleteModal.msg.senderId._id;
            const isSender = sid === currentUserId;
            const ageMs = new Date().getTime() - new Date(deleteModal.msg.createdAt).getTime();
            return isSender && ageMs < 15 * 60 * 1000;
          })()}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onClose={() => setDeleteModal({ open: false, msg: null })}
        />
      )}
      {forwardModal.open && forwardModal.msg && (
        <ForwardModal
          threads={directThreads}
          onForward={handleForwardExecute}
          onClose={() => setForwardModal({ open: false, msg: null })}
        />
      )}

      <div className="messaging-heading">
        <div>
          <h1>Messages</h1>
          <p>Keep your career conversations moving.</p>
        </div>
        {!isLoading && unreadThreads > 0 && (
          <span className="messaging-unread-summary">
            {unreadThreads} unread {unreadThreads === 1 ? 'conversation' : 'conversations'}
          </span>
        )}
      </div>

      <div className="inbox-shell">
        {showThreadList && (
          <aside className="inbox-thread-panel" aria-label="Conversations">
            <div className="inbox-list-heading">
              <h2>Your conversations</h2>
              <span>{isLoading ? '…' : threads.length}</span>
            </div>
            <label className="inbox-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
              />
            </label>
            <div className="inbox-filters" role="group" aria-label="Filter conversations">
              {(['all', 'unread', 'read'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={conversationFilter === filter}
                  onClick={() => setConversationFilter(filter)}
                >
                  {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}
                  {filter === 'unread' && unreadThreads > 0 && <span>{unreadThreads}</span>}
                </button>
              ))}
            </div>
            {freelanceThreads.length > 0 && (
              <label className="inbox-kind-filter">
                <BriefcaseBusiness size={14} aria-hidden="true" />
                <select
                  aria-label="Conversation type"
                  value={conversationKind}
                  onChange={(event) =>
                    setConversationKind(event.target.value as 'all' | 'direct' | 'freelance_order')
                  }
                >
                  <option value="all">All conversation types</option>
                  <option value="direct">Direct messages</option>
                  <option value="freelance_order">Freelance orders</option>
                </select>
              </label>
            )}
            <div className="inbox-thread-scroll" aria-busy={isLoading}>
              {isLoading ? (
                <div
                  className="inbox-thread-loading"
                  role="status"
                  aria-label="Loading conversations"
                >
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} aria-hidden="true">
                      <i />
                      <span />
                    </div>
                  ))}
                </div>
              ) : threadError ? (
                <div className="inbox-list-empty" role="status">
                  <CircleAlert size={26} />
                  <h3>Conversations couldn’t load</h3>
                  <p>Please try again in a moment.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setThreadError(false);
                      setThreadRetry((value) => value + 1);
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : visibleThreads.length === 0 ? (
                <div className="inbox-list-empty" role="status">
                  {threads.length ? <Search size={26} /> : <MessageSquare size={26} />}
                  <h3>
                    {threads.length ? 'No conversations match' : 'Your conversations start here'}
                  </h3>
                  <p>
                    {threads.length
                      ? 'Try another name, message, or filter.'
                      : 'Messages from employers, mentors, and your university will appear here.'}
                  </p>
                  {threads.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setConversationSearch('');
                        setConversationFilter('all');
                        setConversationKind('all');
                      }}
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                visibleThreads.map((thread) => {
                  const active = selectedThread?.threadId === thread.threadId;
                  const unread = thread.unreadCount > 0;
                  const preview = thread.lastMessage.isDeletedForEveryone
                    ? 'Message deleted'
                    : thread.lastMessage.content ||
                      (thread.lastMessage.attachments?.length
                        ? 'Attachment'
                        : thread.threadType === 'freelance_order'
                          ? 'Freelance order chat ready'
                          : 'Start the conversation');
                  return (
                    <button
                      type="button"
                      key={thread.threadId}
                      className={['inbox-thread', active && 'is-active', unread && 'is-unread']
                        .filter(Boolean)
                        .join(' ')}
                      aria-label={`Open conversation with ${thread.otherUser.name}${unread ? `, ${thread.unreadCount} unread` : ''}`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => handleThreadSelect(thread)}
                    >
                      <Avatar user={thread.otherUser} size={42} />
                      <span className="inbox-thread-copy">
                        <span className="inbox-thread-title">
                          <strong>{thread.otherUser.name}</strong>
                          <time dateTime={thread.lastMessage.createdAt}>
                            {fmtConversationDate(thread.lastMessage.createdAt)}
                          </time>
                        </span>
                        {thread.threadType === 'freelance_order' && thread.freelanceOrder && (
                          <span className="inbox-thread-context">
                            <BriefcaseBusiness size={12} />
                            {thread.freelanceOrder.title}
                          </span>
                        )}
                        <span className="inbox-thread-bottom">
                          <span>
                            {getMessageSenderId(thread.lastMessage) === currentUserId
                              ? 'You: '
                              : ''}
                            {preview}
                          </span>
                          {unread && <b className="inbox-unread-count">{thread.unreadCount}</b>}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {showChatPanel && (
          <section
            className="inbox-chat"
            aria-label={
              selectedThread ? `Conversation with ${selectedThread.otherUser.name}` : 'Conversation'
            }
          >
            {selectedThread ? (
              <>
                <header className="inbox-chat-header">
                  {isMobileViewport && (
                    <button
                      className="inbox-icon-button"
                      type="button"
                      aria-label="Back to conversations"
                      onClick={() => {
                        setMobilePane('list');
                        requestAnimationFrame(() =>
                          document
                            .querySelector<HTMLButtonElement>('.inbox-thread.is-active')
                            ?.focus()
                        );
                      }}
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <Avatar user={selectedThread.otherUser} size={40} />
                  <div className="inbox-participant">
                    <h2>{selectedThread.otherUser.name}</h2>
                    <p>
                      {selectedThread.otherUser.role === 'employer'
                        ? selectedThread.otherUser.companyName || 'Employer'
                        : selectedThread.otherUser.role === 'alumni'
                          ? 'Alumni mentor'
                          : selectedThread.otherUser.role.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <span className="inbox-chat-category">
                    {selectedThread.threadType === 'freelance_order'
                      ? 'Freelance'
                      : 'Direct message'}
                  </span>
                </header>
                {selectedThread.threadType === 'freelance_order' &&
                  selectedThread.freelanceOrder && (
                    <div className="inbox-order-context">
                      <BriefcaseBusiness size={16} />
                      <strong>{selectedThread.freelanceOrder.title}</strong>
                      <span>{selectedThread.freelanceOrder.status.replaceAll('_', ' ')}</span>
                    </div>
                  )}

                <div className="inbox-history-wrap">
                  <div
                    className="inbox-history"
                    ref={messagesScrollerRef}
                    aria-label="Message history"
                    aria-busy={messagesLoading}
                    onScroll={(event) => {
                      const node = event.currentTarget;
                      setShowLatest(node.scrollHeight - node.scrollTop - node.clientHeight > 100);
                    }}
                  >
                    {messagesLoading ? (
                      <div className="inbox-chat-loading">
                        <BrandLoader variant="section" label="Loading messages" />
                      </div>
                    ) : messageLoadError ? (
                      <div className="inbox-chat-loading" role="status">
                        <CircleAlert size={25} />
                        <strong>Messages couldn’t load</strong>
                        <button
                          type="button"
                          onClick={() => {
                            setMessagesLoading(true);
                            setMessageLoadError(false);
                            setMessageRetry((value) => value + 1);
                          }}
                        >
                          Try again
                        </button>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="inbox-chat-loading">
                        <MessageSquare size={30} />
                        <h3>A conversation with potential</h3>
                        <p>
                          {selectedThreadReadOnly
                            ? 'There are no messages in this conversation yet.'
                            : 'Introduce yourself or pick up where you left off.'}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const previous = messages[index - 1];
                        const newDay =
                          !previous ||
                          new Date(previous.createdAt).toDateString() !==
                            new Date(msg.createdAt).toDateString();
                        const grouped =
                          !newDay &&
                          getMessageSenderId(previous) === getMessageSenderId(msg) &&
                          new Date(msg.createdAt).getTime() -
                            new Date(previous.createdAt).getTime() <
                            5 * 60 * 1000;
                        return (
                          <React.Fragment key={msg._id || index}>
                            {newDay && (
                              <div className="inbox-date-divider">
                                <span>{fmtMessageDate(msg.createdAt)}</span>
                              </div>
                            )}
                            <MessageItem
                              message={msg}
                              isMe={getMessageSenderId(msg) === currentUserId}
                              grouped={grouped}
                              onForward={() => setForwardModal({ open: true, msg })}
                              onDelete={() => setDeleteModal({ open: true, msg })}
                              onEdit={() => {
                                setEditingMsg(msg);
                                setInputText(msg.content);
                                requestAnimationFrame(() => composerRef.current?.focus());
                              }}
                            />
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                  {showLatest && !messagesLoading && (
                    <button className="inbox-jump-latest" type="button" onClick={scrollToBottom}>
                      <ArrowDown size={14} /> Latest messages
                    </button>
                  )}
                </div>

                <div className="inbox-composer">
                  {editingMsg && (
                    <div className="inbox-editing">
                      <span>
                        <Edit2 size={14} /> Editing message
                      </span>
                      <button
                        className="inbox-icon-button"
                        aria-label="Cancel editing"
                        type="button"
                        onClick={() => {
                          setEditingMsg(null);
                          setInputText('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {currentUserRole === 'employer' &&
                    selectedThread.threadType === 'direct' &&
                    !editingMsg && (
                      <details className="inbox-templates">
                        <summary>
                          <FileText size={14} /> Quick replies <ChevronDown size={13} />
                        </summary>
                        <div>
                          {[
                            { key: 'interview_invite', label: 'Interview invite' },
                            { key: 'offer_letter', label: 'Offer letter' },
                            { key: 'rejection', label: 'Rejection' },
                          ].map((item) => (
                            <button
                              type="button"
                              key={item.key}
                              onClick={() => {
                                applyTemplate(item.key);
                                composerRef.current?.focus();
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </details>
                    )}
                  {messagingLocked && (
                    <div className="inbox-readonly">
                      <Lock size={15} />
                      <p>
                        {selectedThread.otherUser.role === 'employer' ||
                        currentUserRole === 'employer'
                          ? 'You can reply once your application is shortlisted, assessment sent, interview scheduled, or hired. You can still read this conversation.'
                          : 'Messaging is available during an accepted or scheduled mentorship session. You can still read this conversation.'}
                      </p>
                    </div>
                  )}
                  {!messagingLocked &&
                    selectedThreadReadOnly &&
                    selectedThread.threadType === 'freelance_order' && (
                      <div className="inbox-readonly">
                        <Lock size={15} />
                        <p>This freelance chat is read-only because the order is closed.</p>
                      </div>
                    )}
                  {!editingMsg && inputFiles.length > 0 && (
                    <div className="inbox-file-previews">
                      {inputFiles.map((file, index) => (
                        <div key={index}>
                          {file.type.startsWith('image/') ? (
                            <ImageIcon size={16} />
                          ) : (
                            <FileText size={16} />
                          )}
                          <span>{file.name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${file.name}`}
                            onClick={() =>
                              setInputFiles((previous) => previous.filter((_, i) => i !== index))
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="inbox-compose-row">
                    {!editingMsg && (
                      <>
                        <button
                          type="button"
                          className="inbox-icon-button inbox-attach"
                          title="Attach files (max 4, 8MB each)"
                          aria-label="Attach files (up to 4 files, 8 MB each)"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={
                            isSending ||
                            isUploading ||
                            inputFiles.length >= 4 ||
                            selectedThreadReadOnly
                          }
                        >
                          <Paperclip size={20} />
                        </button>
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          ref={fileInputRef}
                          hidden
                          onChange={(event) => {
                            if (event.target.files) {
                              const incoming = Array.from(event.target.files);
                              setInputFiles((previous) => [...previous, ...incoming].slice(0, 4));
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }
                          }}
                        />
                      </>
                    )}
                    <textarea
                      ref={composerRef}
                      aria-label={editingMsg ? 'Edit message' : 'Message'}
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                      placeholder={
                        selectedThreadReadOnly
                          ? 'This conversation is read-only.'
                          : editingMsg
                            ? 'Edit your message…'
                            : 'Write a message…'
                      }
                      disabled={isSending || isUploading || selectedThreadReadOnly}
                      rows={2}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          handleSendOrEdit();
                        }
                      }}
                    />
                    <button
                      className="inbox-send"
                      type="button"
                      aria-label={editingMsg ? 'Save message' : 'Send message'}
                      onClick={handleSendOrEdit}
                      disabled={isSending || isUploading || !canSend}
                    >
                      {isSending || isUploading ? (
                        <Loader2 size={19} className="animate-spin" />
                      ) : (
                        <Send size={19} />
                      )}
                    </button>
                  </div>
                  <div className="inbox-composer-note">
                    <span>
                      {isUploading
                        ? 'Uploading attachments…'
                        : isSending
                          ? 'Sending…'
                          : 'Keep it thoughtful. Make it count.'}
                    </span>
                    <span>Enter to send · Shift + Enter for a new line</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="inbox-welcome">
                <span className="inbox-welcome-icon">
                  <MessageSquare size={31} strokeWidth={1.4} />
                </span>
                <p className="inbox-welcome-eyebrow">Your career, in conversation</p>
                <h2>
                  Good things start
                  <br />
                  with a conversation.
                </h2>
                <p>
                  Select a conversation to connect with the people supporting your next chapter.
                </p>
                <div>
                  <BriefcaseBusiness size={15} /> Employers <span>·</span> Mentors <span>·</span>{' '}
                  Your university
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function MessageItem({
  message: msg,
  isMe,
  grouped,
  onForward,
  onEdit,
  onDelete,
}: {
  message: Message;
  isMe: boolean;
  grouped: boolean;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuBelow, setMenuBelow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div
      className={['inbox-message', isMe ? 'is-outgoing' : 'is-incoming', grouped && 'is-grouped']
        .filter(Boolean)
        .join(' ')}
    >
      {supportMessageTypeLabel(msg.messageType) && (
        <span className="inbox-message-label">{supportMessageTypeLabel(msg.messageType)}</span>
      )}
      {msg.forwardedFromId && (
        <span className="inbox-forwarded">
          <Forward size={12} /> Forwarded
        </span>
      )}
      <div className="inbox-message-line">
        <div
          className={['inbox-bubble', msg.isDeletedForEveryone && 'is-deleted']
            .filter(Boolean)
            .join(' ')}
        >
          {msg.isDeletedForEveryone ? (
            <em>This message was deleted</em>
          ) : msg.content?.trim() ? (
            msg.content
          ) : null}
          {!msg.isDeletedForEveryone && !!msg.attachments?.length && (
            <div className="inbox-attachments">
              {msg.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    attachment.type.startsWith('image/')
                      ? 'inbox-image-attachment'
                      : 'inbox-document-attachment'
                  }
                >
                  {attachment.type.startsWith('image/') ? (
                    <img src={attachment.url} alt={attachment.name} loading="lazy" />
                  ) : (
                    <>
                      <FileText size={18} />
                      <span>{attachment.name}</span>
                    </>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
        {!msg.isDeletedForEveryone && (
          <div
            className="inbox-message-menu"
            ref={menuRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
            }}
          >
            <button
              className="inbox-more"
              ref={triggerRef}
              type="button"
              aria-label="Message actions"
              aria-expanded={open}
              onClick={() => {
                const trigger = triggerRef.current;
                const history = trigger?.closest('.inbox-history');
                if (trigger && history)
                  setMenuBelow(
                    trigger.getBoundingClientRect().top - history.getBoundingClientRect().top < 140
                  );
                setOpen((value) => !value);
              }}
            >
              <MoreHorizontal size={18} />
            </button>
            {open && (
              <div
                className="inbox-message-actions"
                data-side={menuBelow ? 'below' : 'above'}
                role="group"
                aria-label="Message actions"
              >
                <ActionBtn
                  icon={<Forward size={15} />}
                  label="Forward"
                  onClick={() => {
                    setOpen(false);
                    onForward();
                  }}
                />
                {isMe && (msg.editCount ?? 0) < 5 && (
                  <ActionBtn
                    icon={<Edit2 size={15} />}
                    label="Edit"
                    onClick={() => {
                      setOpen(false);
                      onEdit();
                    }}
                  />
                )}
                <ActionBtn
                  icon={<Trash2 size={15} />}
                  label="Delete"
                  color={C.danger}
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="inbox-message-meta">
        <time dateTime={msg.createdAt}>{fmtTime(msg.createdAt)}</time>
        {(msg.editCount ?? 0) > 0 && <span>· Edited</span>}
        {isMe && (
          <span aria-label={msg.isRead ? 'Read' : 'Sent'}>
            {msg.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
          </span>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  color = '#60717d',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      className="inbox-message-action"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '4px 6px',
        color,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f6f8f9')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
