'use client';

import React, { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { Send, Check, CheckCheck, Loader2, X, Forward, Edit2, Trash2 } from 'lucide-react';

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
  content: string;
  isRead: boolean;
  createdAt: string;
  templateType?: string | null;
  editCount?: number;
  forwardedFromId?: string;
  isDeletedForEveryone?: boolean;
};
type Thread = {
  threadId: string;
  lastMessage: Message;
  unreadCount: number;
  otherUser: UserData;
};

/* ─── Colour tokens (mirrors globals.css) ────────────────────────── */
const C = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  cyan: '#22d3ee',
  deep: '#1e293b',
  bg: '#f1f5f9',
  gray: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  border: '#e2e8f0',
  white: '#ffffff',
  /* gradient sent bubble */
  bubbleOut: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  bubbleIn: '#ffffff',
} as const;

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const initials = (name: string) => name?.charAt(0).toUpperCase() ?? '?';

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ user, size = 40 }: { user: UserData; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 800,
        color: C.white,
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
  return (
    <div
      style={{
        position: 'fixed',
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
        style={{
          background: C.white,
          borderRadius: 20,
          width: 380,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
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
              borderRadius: 14,
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
                borderRadius: 14,
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
  return (
    <div
      style={{
        position: 'fixed',
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
        style={{
          background: C.white,
          width: 420,
          borderRadius: 20,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
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
}: {
  currentUserId: string;
  currentUserRole: string;
  initiateUserId?: string;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = useState('');
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; msg: Message | null }>({
    open: false,
    msg: null,
  });
  const [forwardModal, setForwardModal] = useState<{ open: boolean; msg: Message | null }>({
    open: false,
    msg: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  /* Refetch threads from server */
  const refetchThreads = () =>
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => {
        if (d.threads) setThreads(d.threads);
      });

  /* ── Fetch Threads ──────────────────────────────────────────── */
  useEffect(() => {
    let url = '/api/messages';
    if (initiateUserId) url += `?initiateUser=${initiateUserId}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.threads) {
          setThreads(d.threads);
          if (initiateUserId) {
            const tgt = d.threads.find((t: Thread) => t.otherUser._id === initiateUserId);
            if (tgt) setSelectedThread(tgt);
          }
        }
        setIsLoading(false);
      })
      .catch(console.error);
  }, [initiateUserId]);

  /* ── Fetch Messages for Selected Thread ─────────────────────── */
  useEffect(() => {
    if (!selectedThread) return;
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: selectedThread.threadId }),
    });
    const prevUnread = selectedThread.unreadCount;
    if (prevUnread > 0)
      window.dispatchEvent(new CustomEvent('messages-read', { detail: { count: prevUnread } }));

    fetch(`/api/messages/${selectedThread.threadId}`)
      .then((r) => r.json())
      .then((d) => {
        setThreads((prev) =>
          prev.map((t) => (t.threadId === selectedThread.threadId ? { ...t, unreadCount: 0 } : t))
        );
        if (d.messages) {
          setMessages(d.messages);
          setTimeout(scrollToBottom, 50);
        }
      });
  }, [selectedThread]);

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
  }, [currentUserId, selectedThread]);

  /* ── Send / Edit ─────────────────────────────────────────────── */
  const handleSendOrEdit = async () => {
    if (!inputText.trim() || !selectedThread) return;
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
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: selectedThread.otherUser._id,
            content: inputText,
            templateType: template || null,
          }),
        });
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          setThreads((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((t) => t.threadId === selectedThread.threadId);
            if (idx >= 0) updated[idx].lastMessage = data.message;
            return updated.sort(
              (a, b) =>
                new Date(b.lastMessage.createdAt).getTime() -
                new Date(a.lastMessage.createdAt).getTime()
            );
          });
        }
      } catch {
        console.error('Send failed');
      }
    }

    setInputText('');
    setTemplate('');
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
      const d = await res.json();
      alert(d.error || 'Cannot delete for everyone'); // fallback
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
  if (isLoading)
    return (
      <div
        style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        <Loader2 className="animate-spin" size={32} color={C.primary} />
      </div>
    );

  const canSend = inputText.trim().length > 0;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      {/* Modals */}
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
          threads={threads}
          onForward={handleForwardExecute}
          onClose={() => setForwardModal({ open: false, msg: null })}
        />
      )}

      {/* Shell */}
      <div
        style={{
          display: 'flex',
          height: '100%',
          flex: 1,
          minHeight: 0,
          background: C.white,
          borderRadius: 24,
          boxShadow: '0 4px 24px rgba(37,99,235,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          border: `1px solid ${C.border}`,
        }}
      >
        {/* ── LEFT: Thread List ── */}
        <div
          style={{
            width: 300,
            borderRight: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            background: C.white,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '22px 20px 18px',
              background: 'linear-gradient(135deg, #1e293b 100%, #2563eb 0%)',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={16} color="#fff" style={{ marginLeft: 1 }} />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#fff',
                  letterSpacing: '-0.3px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Messages
              </h2>
            </div>
          </div>

          {/* Thread list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {threads.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.gray, fontSize: 14 }}>
                No conversations yet
              </div>
            ) : (
              threads.map((thread) => {
                const sel = selectedThread?.threadId === thread.threadId;
                const unread = thread.unreadCount > 0;
                const ou = thread.otherUser;
                const preview = thread.lastMessage.isDeletedForEveryone
                  ? '🗑 Message deleted'
                  : thread.lastMessage.content || '';

                return (
                  <div
                    key={thread.threadId}
                    onClick={() => setSelectedThread(thread)}
                    style={{
                      padding: '14px 24px',
                      cursor: 'pointer',
                      background: sel
                        ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(34,211,238,0.06))'
                        : C.white,
                      borderLeft: `4px solid ${sel ? C.primary : 'transparent'}`,
                      borderBottom: `1px solid ${C.bg}`,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!sel) e.currentTarget.style.background = C.bg;
                    }}
                    onMouseLeave={(e) => {
                      if (!sel) e.currentTarget.style.background = C.white;
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar user={ou} size={44} />
                        {unread && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              background: '#06b6d4',
                              border: '2px solid white',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: unread ? 800 : 600,
                              fontSize: 14,
                              color: sel ? C.primary : C.deep,
                            }}
                          >
                            {ou.name}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: unread ? C.primary : C.gray,
                              fontWeight: 600,
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            {fmtTime(thread.lastMessage.createdAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              color: unread ? C.deep : C.gray,
                              fontWeight: unread ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              marginRight: 8,
                            }}
                          >
                            {thread.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                            {preview}
                          </div>
                          {unread && (
                            <div
                              style={{
                                background: C.primary,
                                color: C.white,
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 99,
                              }}
                            >
                              {thread.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat Window ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
                  borderBottom: `1px solid rgba(255,255,255,0.08)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <Avatar user={selectedThread.otherUser} size={46} />
                <div>
                  <div style={{ fontWeight: 800, color: C.white, fontSize: 16 }}>
                    {selectedThread.otherUser.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.white, textTransform: 'capitalize' }}>
                    {selectedThread.otherUser.role === 'employer'
                      ? selectedThread.otherUser.companyName || 'Employer'
                      : selectedThread.otherUser.role}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}
              >
                {messages.map((msg, i) => {
                  const sid = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
                  const isMe = sid === currentUserId;

                  return (
                    <div
                      key={msg._id || i}
                      onMouseEnter={() => setHoveredMsgId(msg._id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '68%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Forwarded label */}
                      {msg.forwardedFromId && (
                        <div
                          style={{
                            fontSize: 11,
                            color: C.gray,
                            marginBottom: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Forward size={11} /> Forwarded
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-end',
                          flexDirection: isMe ? 'row-reverse' : 'row',
                        }}
                      >
                        {/* Bubble */}
                        <div
                          style={{
                            background: isMe ? C.bubbleOut : C.bubbleIn,
                            color: isMe ? C.white : C.deep,
                            padding: '12px 16px',
                            borderRadius: 20,
                            borderBottomRightRadius: isMe ? 4 : 20,
                            borderBottomLeftRadius: isMe ? 20 : 4,
                            fontSize: 14,
                            lineHeight: 1.55,
                            whiteSpace: 'pre-wrap',
                            boxShadow: isMe
                              ? '0 4px 14px rgba(37,99,235,0.25)'
                              : '0 2px 8px rgba(0,0,0,0.06)',
                            border: isMe ? 'none' : `1px solid ${C.border}`,
                          }}
                        >
                          {msg.isDeletedForEveryone ? (
                            <span style={{ fontStyle: 'italic', opacity: 0.65 }}>
                              🗑 This message was deleted
                            </span>
                          ) : (
                            <>{msg.content}</>
                          )}
                        </div>

                        {/* Hover actions */}
                        {hoveredMsgId === msg._id && !msg.isDeletedForEveryone && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 2,
                              background: C.white,
                              padding: '4px 6px',
                              borderRadius: 20,
                              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                              border: `1px solid ${C.border}`,
                              alignItems: 'center',
                            }}
                          >
                            <ActionBtn
                              icon={<Forward size={13} />}
                              label="Forward"
                              onClick={() => setForwardModal({ open: true, msg })}
                            />
                            {isMe && (msg.editCount ?? 0) < 5 && (
                              <ActionBtn
                                icon={<Edit2 size={13} />}
                                label="Edit"
                                onClick={() => {
                                  setEditingMsg(msg);
                                  setInputText(msg.content);
                                }}
                              />
                            )}
                            <ActionBtn
                              icon={<Trash2 size={13} />}
                              label="Delete"
                              color={C.danger}
                              onClick={() => setDeleteModal({ open: true, msg })}
                            />
                          </div>
                        )}
                      </div>

                      {/* Meta row */}
                      <div
                        style={{
                          fontSize: 11,
                          color: C.gray,
                          marginTop: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <span>{fmtTime(msg.createdAt)}</span>
                        {(msg.editCount ?? 0) > 0 && <span>· Edited</span>}
                        {isMe &&
                          (msg.isRead ? (
                            <CheckCheck size={14} color={C.primary} strokeWidth={2.5} />
                          ) : (
                            <Check size={14} color={C.gray} strokeWidth={2.5} />
                          ))}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div
                style={{
                  padding: '16px 24px',
                  background: C.white,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {/* Editing indicator */}
                {editingMsg && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 14px',
                      background: '#FEF9C3',
                      border: `1px solid #FDE68A`,
                      borderRadius: 8,
                      marginBottom: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#92400E',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Edit2 size={14} /> Editing message
                    </div>
                    <X
                      size={15}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setEditingMsg(null);
                        setInputText('');
                      }}
                    />
                  </div>
                )}

                {/* Templates */}
                {currentUserRole === 'employer' && !editingMsg && (
                  <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      {
                        key: 'interview_invite',
                        label: 'Interview Invite',
                        bg: '#EFF6FF',
                        border: '#BFDBFE',
                        color: '#1E40AF',
                      },
                      {
                        key: 'offer_letter',
                        label: 'Offer Letter',
                        bg: '#F0FDF4',
                        border: '#BBF7D0',
                        color: '#166534',
                      },
                      {
                        key: 'rejection',
                        label: 'Rejection',
                        bg: '#FFF1F2',
                        border: '#FECDD3',
                        color: '#9F1239',
                      },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        onClick={() => applyTemplate(tmpl.key)}
                        style={{
                          fontSize: 12,
                          padding: '5px 14px',
                          borderRadius: 99,
                          background: tmpl.bg,
                          border: `1px solid ${tmpl.border}`,
                          cursor: 'pointer',
                          color: tmpl.color,
                          fontWeight: 700,
                          transition: 'all 0.15s',
                        }}
                      >
                        + {tmpl.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-end',
                    background: C.bg,
                    padding: '8px 8px 8px 14px',
                    borderRadius: 24,
                    border: `1.5px solid ${C.border}`,
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Textarea */}
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={editingMsg ? 'Edit message…' : 'Type a message…'}
                    disabled={isSending}
                    style={{
                      flex: 1,
                      minHeight: 24,
                      maxHeight: 120,
                      resize: 'none',
                      padding: '8px 0',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      color: C.deep,
                      lineHeight: 1.5,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendOrEdit();
                      }
                    }}
                  />

                  {/* Send button */}
                  <button
                    onClick={handleSendOrEdit}
                    disabled={isSending || !canSend}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      flexShrink: 0,
                      background: canSend ? C.bubbleOut : '#CBD5E1',
                      color: C.white,
                      border: 'none',
                      cursor: canSend ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: canSend ? `0 4px 14px rgba(37,99,235,0.3)` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={17} style={{ marginLeft: 1 }} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
                }}
              >
                <Send size={32} color={C.white} style={{ marginLeft: 3 }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 17, color: C.deep, margin: 0 }}>
                Select a conversation
              </p>
              <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>
                Pick a thread from the left to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Tiny action button ─────────────────────────────────────────── */
function ActionBtn({
  icon,
  label,
  onClick,
  color = '#64748b',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      title={label}
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
      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
    </button>
  );
}
