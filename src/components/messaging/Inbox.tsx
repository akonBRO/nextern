'use client';

import React, { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { Send, CheckCheck, Loader2 } from 'lucide-react';

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
};

type Thread = {
  threadId: string;
  lastMessage: Message;
  unreadCount: number;
  otherUser: UserData;
};

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Fetch Threads ──────────────────────────────────────────────
  useEffect(() => {
    let url = '/api/messages';
    if (initiateUserId) {
      url += `?initiateUser=${initiateUserId}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.threads) {
          setThreads(data.threads);
          if (initiateUserId) {
            const tgt = data.threads.find((t: Thread) => t.otherUser._id === initiateUserId);
            if (tgt) setSelectedThread(tgt);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => console.error(err));
  }, [initiateUserId]);

  // ── Fetch Messages for Selected Thread ─────────────────────────
  useEffect(() => {
    if (!selectedThread) return;

    // Mark messages as read
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: selectedThread.threadId }),
    });

    // Update local state unread count immediately
    const prevUnread = selectedThread.unreadCount;
    if (prevUnread > 0) {
      window.dispatchEvent(new CustomEvent('messages-read', { detail: { count: prevUnread } }));
    }

    fetch(`/api/messages/${selectedThread.threadId}`)
      .then((res) => res.json())
      .then((data) => {
        setThreads((prev) =>
          prev.map((t) => (t.threadId === selectedThread.threadId ? { ...t, unreadCount: 0 } : t))
        );
        if (data.messages) {
          setMessages(data.messages);
          setTimeout(scrollToBottom, 100);
        }
      });
  }, [selectedThread]);

  // ── Pusher Real-time Listener ──────────────────────────────────
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return;

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });
    }

    const channel = pusherRef.current.subscribe(`user-${currentUserId}`);

    channel.bind('new-message', (incomingMessage: Message) => {
      // 1. If we are currently viewing the thread this message belongs to, add it
      if (selectedThread && selectedThread.threadId === incomingMessage.threadId) {
        setMessages((prev) => [...prev, incomingMessage]);

        // Autoread since we are looking at it
        fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: incomingMessage.threadId }),
        });

        window.dispatchEvent(new Event('message-intercepted'));
        setTimeout(scrollToBottom, 100);
      } else {
        // 2. Otherwise just update thread list (unread counts will bump in the next state sync if unread)
        setThreads((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((t) => t.threadId === incomingMessage.threadId);
          if (idx >= 0) {
            updated[idx].lastMessage = incomingMessage;
            updated[idx].unreadCount += 1;
          } else {
            // Need to fetch full threads to get the other profile since it's completely new
            fetch('/api/messages')
              .then((res) => res.json())
              .then((data) => {
                if (data.threads) setThreads(data.threads);
              });
          }
          // Sort to put this thread at the top
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
          );
        });
      }
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`user-${currentUserId}`);
      }
    };
  }, [currentUserId, selectedThread]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedThread) return;

    setIsSending(true);
    const payload = {
      receiverId: selectedThread.otherUser._id,
      content: inputText,
      templateType: template || null,
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        setInputText('');
        setTemplate('');
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send:', err);
    }
    setIsSending(false);
  };

  const applyTemplate = (type: string) => {
    setTemplate(type);
    if (!selectedThread) return;

    let text = '';
    const otherName = selectedThread.otherUser.name.split(' ')[0];

    if (type === 'interview_invite') {
      text = `Hi ${otherName},\n\nWe were impressed by your profile and would love to invite you for an interview. Please let us know your availability for a 30-minute video call this week.\n\nBest regards.`;
    } else if (type === 'rejection') {
      text = `Hi ${otherName},\n\nThank you for your interest. Unfortunately, we have decided to move forward with other candidates whose skills better match our current needs. We wish you the best in your career journey.\n\nBest regards.`;
    } else if (type === 'offer_letter') {
      text = `Hi ${otherName},\n\nCongratulations! We are thrilled to offer you a position with our team. Please review the attached contract details. Let us know if you have any questions.\n\nWelcome aboard!`;
    }
    setInputText(text);
  };

  // ── Utils ─────────────────────────
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', height: '600px', alignItems: 'center', justifyContent: 'center' }}
      >
        <Loader2 className="animate-spin" size={32} color="#60A5FA" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        flex: 1,
        minHeight: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
      }}
    >
      {/* ── LEFT PANE: THREADS ── */}
      <div
        style={{
          width: '320px',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F8FAFC',
        }}
      >
        <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFF' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Messages</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {threads.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              No messages yet
            </div>
          ) : (
            threads.map((thread) => {
              const isSelected = selectedThread?.threadId === thread.threadId;
              const hasUnread = thread.unreadCount > 0;
              const oUser = thread.otherUser;

              return (
                <div
                  key={thread.threadId}
                  onClick={() => setSelectedThread(thread)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#EFF6FF' : hasUnread ? '#FFF' : 'transparent',
                    borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{ fontWeight: hasUnread ? 800 : 600, color: '#1E293B', fontSize: 14 }}
                    >
                      {oUser.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: hasUnread ? '#2563EB' : '#94A3B8',
                        fontWeight: 600,
                      }}
                    >
                      {formatTime(thread.lastMessage.createdAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: hasUnread ? '#1E293B' : '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        marginRight: 12,
                        fontWeight: hasUnread ? 500 : 400,
                      }}
                    >
                      {thread.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                      {thread.lastMessage.content}
                    </div>
                    {hasUnread && (
                      <div
                        style={{
                          background: '#3B82F6',
                          color: '#FFF',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 99,
                        }}
                      >
                        {thread.unreadCount}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', marginTop: 4, gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'capitalize' }}>
                      {oUser.role === 'employer' ? oUser.companyName || 'Employer' : oUser.role}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: CHAT WINDOW ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF' }}>
        {selectedThread ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#64748B',
                }}
              >
                {selectedThread.otherUser.image ? (
                  <img
                    src={selectedThread.otherUser.image}
                    alt="pic"
                    style={{ width: '100%', borderRadius: 20 }}
                  />
                ) : (
                  selectedThread.otherUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>
                  {selectedThread.otherUser.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>
                  {selectedThread.otherUser.role === 'employer'
                    ? selectedThread.otherUser.companyName || 'Employer'
                    : selectedThread.otherUser.role}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {messages.map((msg, i) => {
                // If senderId isn't populated on generic loads, we still check just the string ID
                const sid = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
                const isMe = sid === currentUserId;

                return (
                  <div
                    key={msg._id || i}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      minWidth: '20%',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isMe ? '#3B82F6' : '#F1F5F9',
                        color: isMe ? '#FFFFFF' : '#0F172A',
                        padding: '12px 16px',
                        borderRadius: 20,
                        borderBottomRightRadius: isMe ? 4 : 20,
                        borderBottomLeftRadius: isMe ? 20 : 4,
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#94A3B8',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        gap: 4,
                      }}
                    >
                      <span>{formatTime(msg.createdAt)}</span>
                      {isMe && msg.isRead && <CheckCheck size={14} color="#3B82F6" />}
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
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              {currentUserRole === 'employer' && (
                <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => applyTemplate('interview_invite')}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: '#FFF',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    + Interview Invite
                  </button>
                  <button
                    onClick={() => applyTemplate('offer_letter')}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: '#DCFCE7',
                      border: '1px solid #BBF7D0',
                      cursor: 'pointer',
                      color: '#166534',
                      fontWeight: 600,
                    }}
                  >
                    + Offer Letter
                  </button>
                  <button
                    onClick={() => applyTemplate('rejection')}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: '#FEE2E2',
                      border: '1px solid #FECACA',
                      cursor: 'pointer',
                      color: '#991B1B',
                      fontWeight: 600,
                    }}
                  >
                    + Rejection Notice
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isSending}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    maxHeight: 120,
                    resize: 'none',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || !inputText.trim()}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: inputText.trim() ? '#3B82F6' : '#94A3B8',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Send size={24} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>Your Messages</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Select a conversation from the left to start chatting.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
