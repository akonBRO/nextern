'use client';

import React, { useEffect, useState } from 'react';
import {
  Star,
  MessageSquareQuote,
  CheckCircle2,
  Shield,
  Award,
  TrendingUp,
  UserCheck,
  Clock,
  Sparkles,
  Building2,
  BookOpen,
  ThumbsUp,
} from 'lucide-react';

interface ReviewData {
  _id: string;
  applicationId: string;
  reviewerId: {
    _id: string;
    name: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  overallRating?: number;
  workEnvironmentRating?: number;
  learningOpportunityRating?: number;
  professionalismRating?: number;
  punctualityRating?: number;
  skillPerformanceRating?: number;
  workQualityRating?: number;
  comment?: string;
  isRecommended?: boolean;
  recommendationText?: string;
  createdAt: string;
  reviewType: string;
}

export default function ReputationHistory({
  userId,
  userRole,
}: {
  userId: string;
  userRole: 'student' | 'employer';
}) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/users/${userId}/reviews`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setReviews(data.data || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, [userId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 120,
              borderRadius: 16,
              background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 12,
          padding: '10px 14px',
          color: '#991B1B',
          fontSize: 13,
        }}
      >
        ⚠️ {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div
        style={{
          background: 'linear-gradient(145deg, #FAFBFF, #F8FAFF)',
          borderRadius: 20,
          padding: '40px 28px',
          border: '1px solid rgba(37, 99, 235, 0.06)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <MessageSquareQuote size={24} color="#94A3B8" />
        </div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#475569',
            margin: '0 0 4px',
            fontFamily: 'var(--font-display)',
          }}
        >
          No Verified Reviews Yet
        </p>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
          Reviews will appear here once verified feedback is submitted.
        </p>
      </div>
    );
  }

  // Calculate aggregate stats
  const getAvgRating = () => {
    if (userRole === 'employer') {
      const ratings = reviews
        .map((r) => r.overallRating)
        .filter((v): v is number => typeof v === 'number' && v > 0);
      return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    } else {
      const ratings = reviews
        .map((r) => r.workQualityRating)
        .filter((v): v is number => typeof v === 'number' && v > 0);
      return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    }
  };

  const avgRating = getAvgRating();
  const recommendationCount = reviews.filter((r) => r.isRecommended).length;

  const renderStars = (rating: number = 0, size: number = 14) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          style={{
            color: star <= rating ? '#F59E0B' : '#E2E8F0',
            transition: 'color 0.2s ease',
          }}
          fill={star <= rating ? 'currentColor' : 'none'}
          strokeWidth={star <= rating ? 0 : 1.5}
        />
      ))}
    </div>
  );

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { label: 'Exceptional', color: '#059669', bg: '#ECFDF5' };
    if (rating >= 3.5) return { label: 'Very Good', color: '#2563EB', bg: '#EFF6FF' };
    if (rating >= 2.5) return { label: 'Good', color: '#D97706', bg: '#FFFBEB' };
    return { label: 'Fair', color: '#64748B', bg: '#F8FAFC' };
  };

  const ratingMeta = getRatingLabel(avgRating);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header with aggregate stats */}
      <div
        style={{
          background: 'linear-gradient(145deg, #FAFBFF, #F0F4FF)',
          borderRadius: 20,
          padding: '24px 28px',
          border: '1px solid rgba(37, 99, 235, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Verified Reputation
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
              Based on {reviews.length} verified {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 10,
          }}
        >
          {/* Average rating */}
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '14px 16px',
              border: '1px solid #E8ECF1',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                lineHeight: 1,
              }}
            >
              {avgRating.toFixed(1)}
            </div>
            <div style={{ margin: '6px auto', display: 'flex', justifyContent: 'center' }}>
              {renderStars(Math.round(avgRating), 12)}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: ratingMeta.color,
                background: ratingMeta.bg,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {ratingMeta.label}
            </span>
          </div>

          {/* Total reviews */}
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '14px 16px',
              border: '1px solid #E8ECF1',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                lineHeight: 1,
              }}
            >
              {reviews.length}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 6 }}>
              Total Reviews
            </div>
          </div>

          {/* Recommendations */}
          {userRole === 'student' && recommendationCount > 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid #E8ECF1',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#2563EB',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                {recommendationCount}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 6 }}>
                Endorsements
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Individual reviews */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: '250px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
      >
        {reviews.map((r) => (
          <div
            key={r._id}
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E8ECF1',
              transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
              e.currentTarget.style.borderColor = '#E8ECF1';
            }}
          >
            {/* Review header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#64748B',
                    fontSize: 16,
                    fontFamily: 'var(--font-display)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {r.reviewerId?.profilePicture ? (
                    <img
                      src={r.reviewerId.profilePicture}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    r.reviewerId?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0F172A',
                      flexWrap: 'wrap',
                    }}
                  >
                    {r.reviewerId?.name}
                    {r.reviewerId?.isVerified && (
                      <CheckCircle2 size={14} color="#2563EB" fill="#EFF6FF" />
                    )}
                  </div>
                  <div>
                    {userRole === 'employer'
                      ? renderStars(r.overallRating)
                      : renderStars(r.workQualityRating)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      color: '#94A3B8',
                    }}
                  >
                    <Clock size={11} />
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* View full review button */}
            <div style={{ padding: '12px 20px', background: '#FAFBFC' }}>
              <button
                onClick={() => setSelectedReview(r)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: 0,
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Read full review <span style={{ fontSize: 16 }}>&rarr;</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal for full review */}
      {selectedReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedReview(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #F1F5F9',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 10,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Full Review
              </h3>
              <button
                onClick={() => setSelectedReview(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Header inside modal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#64748B',
                      fontSize: 18,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {selectedReview.reviewerId?.profilePicture ? (
                      <img
                        src={selectedReview.reviewerId.profilePicture}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      selectedReview.reviewerId?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      {selectedReview.reviewerId?.name}
                      {selectedReview.reviewerId?.isVerified && (
                        <CheckCircle2 size={16} color="#2563EB" fill="#EFF6FF" />
                      )}
                    </div>
                    <div>
                      {userRole === 'employer'
                        ? renderStars(selectedReview.overallRating)
                        : renderStars(selectedReview.workQualityRating)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: '#64748B',
                      }}
                    >
                      <Clock size={12} />
                      {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {userRole === 'employer' ? (
                  <>
                    <MetricPill
                      icon={<Building2 size={14} />}
                      label="Environment"
                      rating={selectedReview.workEnvironmentRating || 0}
                    />
                    <MetricPill
                      icon={<BookOpen size={14} />}
                      label="Learning"
                      rating={selectedReview.learningOpportunityRating || 0}
                    />
                  </>
                ) : (
                  <>
                    <MetricPill
                      icon={<UserCheck size={14} />}
                      label="Professionalism"
                      rating={selectedReview.professionalismRating || 0}
                    />
                    <MetricPill
                      icon={<Clock size={14} />}
                      label="Punctuality"
                      rating={selectedReview.punctualityRating || 0}
                    />
                    <MetricPill
                      icon={<TrendingUp size={14} />}
                      label="Skills"
                      rating={selectedReview.skillPerformanceRating || 0}
                    />
                    <MetricPill
                      icon={<ThumbsUp size={14} />}
                      label="Work Quality"
                      rating={selectedReview.workQualityRating || 0}
                    />
                  </>
                )}
              </div>

              {selectedReview.comment && (
                <div style={{ paddingBottom: 24, borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
                  <h4
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      margin: '0 0 12px 0',
                    }}
                  >
                    Written Feedback
                  </h4>
                  <p
                    style={{
                      fontSize: 15,
                      color: '#475569',
                      lineHeight: 1.7,
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{selectedReview.comment}&rdquo;
                  </p>
                </div>
              )}

              {selectedReview.isRecommended && selectedReview.recommendationText && (
                <div
                  style={{
                    padding: '20px 18px',
                    background: 'linear-gradient(135deg, #EFF6FF, #F0F7FF)',
                    border: '1px solid rgba(37, 99, 235, 0.15)',
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 999,
                      letterSpacing: 0.3,
                      marginBottom: 12,
                    }}
                  >
                    <Award size={10} /> FORMAL ENDORSEMENT
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: '#1E3A5F',
                      fontWeight: 500,
                      lineHeight: 1.75,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      paddingRight: '12px',
                    }}
                  >
                    {selectedReview.recommendationText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({
  icon,
  label,
  rating,
}: {
  icon: React.ReactNode;
  label: string;
  rating: number;
}) {
  const hasRating = typeof rating === 'number' && rating > 0;
  const getColor = (r: number) => {
    if (r >= 4) return { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' };
    if (r >= 3) return { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
    if (r >= 2) return { text: '#92400E', bg: '#FFFBEB', border: '#FDE68A' };
    return { text: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
  };
  const c = hasRating ? getColor(rating) : { text: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '6px 8px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <span style={{ color: c.text, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: c.text,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: c.text,
          fontFamily: 'var(--font-display)',
          flexShrink: 0,
          marginLeft: 2,
        }}
      >
        {hasRating ? rating : '—'}
      </span>
    </div>
  );
}
