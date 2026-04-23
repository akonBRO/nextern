/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Briefcase, Building, Linkedin, CheckCircle2 } from 'lucide-react';
import RequestSessionModal from '@/components/mentorship/RequestSessionModal';

export default function MentorDetailPage({ params }: { params: Promise<{ mentorId: string }> }) {
  const router = useRouter();
  const { mentorId } = use(params);

  const [mentor, setMentor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    async function fetchMentor() {
      try {
        setLoading(true);
        const res = await fetch(`/api/mentors/${mentorId}`);
        if (!res.ok) {
          throw new Error('Mentor not found');
        }
        const data = await res.json();
        setMentor(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMentor();
  }, [mentorId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: '#94A3B8' }}>
        Loading profile...
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: '40px auto',
          textAlign: 'center',
          padding: 40,
          background: '#FEF2F2',
          borderRadius: 20,
          color: '#DC2626',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0' }}>{error || 'Mentor not found'}</h2>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            background: '#FFFFFF',
            border: '1px solid #FECACA',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <button
        onClick={() => router.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: '#64748B',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to Mentors
      </button>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
        }}
      >
        {/* Header Cover */}
        <div style={{ height: 160, background: 'linear-gradient(135deg, #1E293B, #0F172A)' }}></div>

        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            {/* Avatar */}
            <div style={{ marginTop: -40 }}>
              {mentor.userId?.image ? (
                <img
                  src={mentor.userId.image}
                  alt={mentor.userId.name}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    fontWeight: 800,
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {mentor.userId?.name?.charAt(0).toUpperCase() || 'M'}
                </div>
              )}
            </div>

            {/* Action */}
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setRequestModalOpen(true)}
                disabled={!mentor.isAvailable}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  background: mentor.isAvailable
                    ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                    : '#E2E8F0',
                  color: mentor.isAvailable ? '#FFFFFF' : '#94A3B8',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: mentor.isAvailable ? 'pointer' : 'not-allowed',
                  boxShadow: mentor.isAvailable ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                }}
              >
                {mentor.isAvailable ? 'Request Mentorship Session' : 'Currently Unavailable'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={{ marginTop: 20 }}>
            <h1
              style={{
                margin: '0 0 8px 0',
                fontSize: 28,
                fontWeight: 900,
                color: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {mentor.userId?.name || 'Unknown User'}
              {mentor.mentorType === 'alumni' && (
                <div
                  title="Verified Alumni"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    color: '#10B981',
                    background: '#D1FAE5',
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  <CheckCircle2 size={14} /> Verified Alumni
                </div>
              )}
            </h1>
            <p style={{ margin: '0 0 20px 0', fontSize: 18, color: '#475569', fontWeight: 500 }}>
              {mentor.currentRole} at{' '}
              <span style={{ color: '#1E293B', fontWeight: 700 }}>{mentor.currentCompany}</span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div
                  title="Average Rating from Students"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                    color: '#475569',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '8px 16px',
                    borderRadius: 999,
                  }}
                >
                  <Star size={20} color="#D97706" fill="#D97706" />
                  <span style={{ fontWeight: 900, color: '#92400E' }}>
                    {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}
                  </span>
                  <span style={{ color: '#B45309', fontSize: 13, fontWeight: 600 }}>
                    ({mentor.totalSessions} sessions)
                  </span>
                </div>

                <div style={{ width: 1, height: 32, background: '#E2E8F0' }}></div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: '#475569',
                  }}
                >
                  <Briefcase size={18} color="#64748B" />
                  {mentor.yearsOfExperience} yrs experience
                </div>
                <div style={{ width: 1, height: 32, background: '#E2E8F0' }}></div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: '#475569',
                  }}
                >
                  <Building size={18} color="#64748B" />
                  {mentor.industry}
                </div>
                {mentor.linkedinUrl && (
                  <>
                    <div style={{ width: 1, height: 32, background: '#E2E8F0' }}></div>
                    <a
                      href={mentor.linkedinUrl as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 14,
                        color: '#0A66C2',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <Linkedin size={18} /> LinkedIn
                    </a>
                  </>
                )}
              </div>

              {mentor.badges && mentor.badges.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Achievements
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(mentor.badges as { badgeName: string; badgeIcon: string }[]).map(
                      (badge, idx) => {
                        const isUploadthingUrl = badge.badgeIcon.startsWith('http');
                        return (
                          <div
                            key={idx}
                            title={`Achievement: ${badge.badgeName}`}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              cursor: 'help',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                          >
                            {isUploadthingUrl ? (
                              <img
                                src={badge.badgeIcon}
                                alt={badge.badgeName}
                                style={{ width: 20, height: 20, objectFit: 'contain' }}
                              />
                            ) : (
                              <span>{badge.badgeIcon}</span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
              <div>
                <h3
                  style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 800, color: '#1E293B' }}
                >
                  About Me
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: '#475569',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {mentor.bio}
                </p>
              </div>

              <div>
                <h3
                  style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 800, color: '#1E293B' }}
                >
                  Areas of Expertise
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mentor.expertise.map((skill: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 13,
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#F8FAFC',
                        color: '#334155',
                        fontWeight: 600,
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RequestSessionModal
        isOpen={requestModalOpen}
        mentorId={mentor._id}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          setRequestModalOpen(false);
          window.location.href = '/student/mentorship/sessions';
        }}
      />
    </div>
  );
}
