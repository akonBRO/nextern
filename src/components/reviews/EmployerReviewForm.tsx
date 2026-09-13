'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Star,
  Award,
  CheckCircle2,
  Shield,
  Sparkles,
  TrendingUp,
  Clock,
  UserCheck,
} from 'lucide-react';

interface EmployerReviewFormProps {
  applicationId: string;
  studentId: string;
  onSuccess?: () => void;
}

export default function EmployerReviewForm({
  applicationId,
  studentId,
  onSuccess,
}: EmployerReviewFormProps) {
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [skillPerformanceRating, setSkillPerformanceRating] = useState(0);
  const [workQualityRating, setWorkQualityRating] = useState(0);

  const [isRecommended, setIsRecommended] = useState(false);
  const [recommendationText, setRecommendationText] = useState('');
  const [comment, setComment] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hoveredStar, setHoveredStar] = useState<Record<string, number>>({});

  // Check if review already exists for this application
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch(`/api/users/${studentId}/reviews`);
        const data = await res.json();
        const existingReview = data.data?.find(
          (r: { applicationId: string }) => r.applicationId === applicationId
        );
        if (existingReview) {
          setAlreadyReviewed(true);
          setProfessionalismRating(existingReview.professionalismRating || 0);
          setPunctualityRating(existingReview.punctualityRating || 0);
          setSkillPerformanceRating(existingReview.skillPerformanceRating || 0);
          setWorkQualityRating(existingReview.workQualityRating || 0);
          setComment(existingReview.comment || '');
          setIsRecommended(existingReview.isRecommended || false);
          setRecommendationText(existingReview.recommendationText || '');
        }
      } catch {
        // Silently fail — allow form to show
      } finally {
        setChecking(false);
      }
    }
    checkExisting();
  }, [applicationId, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !professionalismRating ||
      !punctualityRating ||
      !skillPerformanceRating ||
      !workQualityRating
    ) {
      setError('Please provide all 4 ratings to complete the evaluation.');
      return;
    }
    if (isRecommended && !recommendationText.trim()) {
      setError('Please provide written feedback for the formal recommendation.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          revieweeId: studentId,
          reviewType: 'employer_to_student',
          professionalismRating,
          punctualityRating,
          skillPerformanceRating,
          workQualityRating,
          comment: comment.trim() || undefined,
          isRecommended,
          recommendationText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setSuccess(true);
      setAlreadyReviewed(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    label: string,
    rating: number,
    setRating: (val: number) => void,
    icon: React.ReactNode
  ) => {
    const key = label;
    const currentHover = hoveredStar[key] || 0;
    const displayRating = currentHover || rating;

    return (
      <div
        style={{
          background: rating > 0 ? 'rgba(8, 127, 114, 0.04)' : '#FAFBFC',
          border: `1.5px solid ${rating > 0 ? 'rgba(8, 127, 114, 0.15)' : '#E8ECF1'}`,
          borderRadius: 12,
          padding: '16px 18px',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: rating > 0 ? '#087f72' : '#f6f8f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: rating > 0 ? '#fff' : '#6e7f89',
              transition: 'all 0.3s ease',
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: rating > 0 ? '#182c39' : '#60717d',
              transition: 'color 0.3s ease',
            }}
          >
            {label}
          </span>
          {rating > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                fontWeight: 700,
                color: '#087f72',
                background: '#eef7f5',
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {rating}/5
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${label}: ${star} out of 5`}
              aria-pressed={star === rating}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar((prev) => ({ ...prev, [key]: star }))}
              onMouseLeave={() => setHoveredStar((prev) => ({ ...prev, [key]: 0 }))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 2px',
                transform: star <= displayRating ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                color: star <= displayRating ? '#F59E0B' : '#CBD5E1',
              }}
            >
              <Star
                size={26}
                fill={star <= displayRating ? 'currentColor' : 'none'}
                strokeWidth={star <= displayRating ? 0 : 1.5}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (checking) {
    return (
      <div
        style={{
          background: '#FAFBFF',
          borderRadius: 12,
          padding: 32,
          border: '1px solid rgba(8, 127, 114, 0.08)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 200,
            borderRadius: 12,
            background: 'linear-gradient(90deg, #f6f8f9 25%, #dfe6e9 50%, #f6f8f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  if (success || alreadyReviewed) {
    return (
      <div
        style={{
          background: '#F0F9FF',
          borderRadius: 12,
          padding: '36px 32px',
          border: '1px solid rgba(8, 127, 114, 0.12)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            background: 'transparent',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            background: 'transparent',
            borderRadius: '50%',
          }}
        />

        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: '#087f72',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
          }}
        >
          <CheckCircle2 size={32} color="#fff" />
        </div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 750,
            color: '#182c39',
            fontFamily: 'var(--font-display)',
            margin: '0 0 8px',
          }}
        >
          Evaluation Complete
        </h3>
        <p
          style={{
            fontSize: 14,
            color: '#60717d',
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 340,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Your verified feedback has been recorded and the student&apos;s reputation profile has
          been updated.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            marginTop: 20,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Shield size={12} /> Verified Review
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#eef7f5',
              color: '#06665d',
              border: '1px solid #c8e3dc',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Sparkles size={12} /> Profile Updated
          </span>
        </div>

        <button
          onClick={() => {
            setAlreadyReviewed(false);
            setSuccess(false);
          }}
          type="button"
          style={{
            marginTop: 24,
            padding: '10px 24px',
            background: '#087f72',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          Edit Evaluation
        </button>
      </div>
    );
  }

  const filledCount = [
    professionalismRating,
    punctualityRating,
    skillPerformanceRating,
    workQualityRating,
  ].filter((r) => r > 0).length;
  const progressPct = (filledCount / 4) * 100;

  return (
    <div
      style={{
        background: '#FAFBFF',
        borderRadius: 12,
        border: '1px solid rgba(8, 127, 114, 0.08)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#f6f8f9',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: 'transparent',
            borderRadius: '50%',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#087f72',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
            }}
          >
            <Award size={20} color="#fff" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 750,
                color: '#182c39',
                fontFamily: 'var(--font-display)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Evaluate Student Performance
            </h2>
            <p style={{ fontSize: 12, color: '#6e7f89', margin: '3px 0 0' }}>
              Your verified evaluation appears on the student&apos;s profile
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 600,
              color: '#60717d',
              marginBottom: 6,
            }}
          >
            <span>{filledCount}/4 categories rated</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: '#dfe6e9',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 99,
                background: progressPct === 100 ? '#10B981' : '#087f72',
                width: `${progressPct}%`,
                transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: 14,
          }}
        >
          {renderStars(
            'Professionalism',
            professionalismRating,
            setProfessionalismRating,
            <UserCheck size={14} />
          )}
          {renderStars('Punctuality', punctualityRating, setPunctualityRating, <Clock size={14} />)}
          {renderStars(
            'Skill Performance',
            skillPerformanceRating,
            setSkillPerformanceRating,
            <TrendingUp size={14} />
          )}
          {renderStars(
            'Overall Quality',
            workQualityRating,
            setWorkQualityRating,
            <Sparkles size={14} />
          )}
        </div>

        {/* Recommendation Toggle */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid rgba(8, 127, 114, 0.08)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              padding: '16px 18px',
              background: isRecommended ? 'rgba(8, 127, 114, 0.04)' : '#FAFBFC',
              border: `1.5px solid ${isRecommended ? 'rgba(8, 127, 114, 0.2)' : '#E8ECF1'}`,
              borderRadius: 12,
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                border: `2px solid ${isRecommended ? '#087f72' : '#CBD5E1'}`,
                background: isRecommended ? '#087f72' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {isRecommended && <CheckCircle2 size={14} color="#fff" />}
            </div>
            <input
              type="checkbox"
              checked={isRecommended}
              onChange={(e) => setIsRecommended(e.target.checked)}
              style={{ display: 'none' }}
            />
            <div>
              <p
                style={{
                  fontWeight: 700,
                  color: '#182c39',
                  fontSize: 14,
                  fontFamily: 'var(--font-display)',
                  margin: 0,
                }}
              >
                Formal Recommendation
              </p>
              <p style={{ fontSize: 12, color: '#60717d', margin: '2px 0 0' }}>
                Provide a written endorsement that appears publicly on the student&apos;s profile
              </p>
            </div>
            <Award
              size={20}
              color={isRecommended ? '#087f72' : '#CBD5E1'}
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            />
          </label>

          {isRecommended && (
            <div style={{ marginTop: 12, animation: 'fadeSlideDown 0.3s ease' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#435663',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                Recommendation Text
              </label>
              <textarea
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1.5px solid rgba(8, 127, 114, 0.15)',
                  background: '#FAFBFF',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  color: '#182c39',
                  outline: 'none',
                  minHeight: 120,
                  resize: 'vertical',
                  lineHeight: 1.7,
                }}
                placeholder="e.g., Jane was an exceptional intern who quickly grasped our tech stack and delivered a full-stack feature within her first month..."
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '10px 14px',
              color: '#991B1B',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <AlertCircle
              size={16}
              style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}
            />{' '}
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || filledCount < 4}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '14px 20px',
            background: filledCount === 4 ? '#087f72' : '#dfe6e9',
            color: filledCount === 4 ? '#fff' : '#6e7f89',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: filledCount === 4 && !isSubmitting ? 'pointer' : 'not-allowed',
            boxShadow: filledCount === 4 ? '0 6px 20px rgba(8, 127, 114, 0.3)' : 'none',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: '-0.2px',
          }}
        >
          <Shield size={16} />
          {isSubmitting
            ? 'Submitting Evaluation...'
            : filledCount === 4
              ? 'Submit Evaluation'
              : `Rate ${4 - filledCount} more to submit`}
        </button>
      </form>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
