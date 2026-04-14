'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Shield,
  Sparkles,
  Building2,
  BookOpen,
  ThumbsUp,
} from 'lucide-react';

interface StudentReviewFormProps {
  applicationId: string;
  employerId: string;
  onSuccess?: () => void;
}

export default function StudentReviewForm({
  applicationId,
  employerId,
  onSuccess,
}: StudentReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [workEnvironmentRating, setWorkEnvironmentRating] = useState(0);
  const [learningOpportunityRating, setLearningOpportunityRating] = useState(0);
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
        const res = await fetch(`/api/users/${employerId}/reviews`);
        const data = await res.json();
        const existingReview = data.data?.find(
          (r: { applicationId: string }) => r.applicationId === applicationId
        );
        if (existingReview) {
          setAlreadyReviewed(true);
          setOverallRating(existingReview.overallRating || 0);
          setWorkEnvironmentRating(existingReview.workEnvironmentRating || 0);
          setLearningOpportunityRating(existingReview.learningOpportunityRating || 0);
          setComment(existingReview.comment || '');
        }
      } catch {
        // Silently fail
      } finally {
        setChecking(false);
      }
    }
    checkExisting();
  }, [applicationId, employerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overallRating || !workEnvironmentRating || !learningOpportunityRating || !comment.trim()) {
      setError('Please fill out all fields and ratings.');
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
          revieweeId: employerId,
          reviewType: 'student_to_employer',
          overallRating,
          workEnvironmentRating,
          learningOpportunityRating,
          comment,
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
          background: rating > 0 ? 'rgba(13, 148, 136, 0.04)' : '#FAFBFC',
          border: `1.5px solid ${rating > 0 ? 'rgba(13, 148, 136, 0.15)' : '#E8ECF1'}`,
          borderRadius: 14,
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
              background: rating > 0 ? 'linear-gradient(135deg, #0D9488, #14B8A6)' : '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: rating > 0 ? '#fff' : '#94A3B8',
              transition: 'all 0.3s ease',
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: rating > 0 ? '#1E293B' : '#64748B',
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
                fontWeight: 800,
                color: '#0D9488',
                background: '#F0FDFA',
                padding: '2px 8px',
                borderRadius: 999,
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
          background: 'linear-gradient(145deg, #FAFFFE, #F0FDFA)',
          borderRadius: 20,
          padding: 32,
          border: '1px solid rgba(13, 148, 136, 0.08)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 200,
            borderRadius: 14,
            background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
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
          background: 'linear-gradient(145deg, #F0FDFA, #ECFDF5)',
          borderRadius: 20,
          padding: '36px 32px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
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
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
          }}
        >
          <CheckCircle2 size={32} color="#fff" />
        </div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#0F172A',
            fontFamily: 'var(--font-display)',
            margin: '0 0 8px',
          }}
        >
          Review Submitted!
        </h3>
        <p
          style={{
            fontSize: 14,
            color: '#64748B',
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 340,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Thank you for sharing your genuine experience. Your review helps other students make
          informed decisions.
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
              borderRadius: 999,
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
              background: '#F0FDFA',
              color: '#0F766E',
              border: '1px solid #99F6E4',
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Sparkles size={12} /> Publicly Visible
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
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          Edit Review
        </button>
      </div>
    );
  }

  const filledCount = [overallRating, workEnvironmentRating, learningOpportunityRating].filter(
    (r) => r > 0
  ).length;
  const allRated = filledCount === 3 && comment.trim().length > 0;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #FAFFFE, #F8FFFE)',
        borderRadius: 20,
        border: '1px solid rgba(13, 148, 136, 0.08)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #134E4A, #0F766E)',
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
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.4)',
            }}
          >
            <MessageSquare size={20} color="#fff" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#F0FDFA',
                fontFamily: 'var(--font-display)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Rate Your Experience
            </h2>
            <p style={{ fontSize: 12, color: '#99F6E4', margin: '3px 0 0' }}>
              Help other students by sharing your internship feedback
            </p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 16, position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(240, 253, 250, 0.6)',
              marginBottom: 6,
            }}
          >
            <span>{filledCount}/3 categories rated</span>
            <span>{comment.trim() ? '✓ Feedback written' : 'Write feedback'}</span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 99,
                background: allRated
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : 'linear-gradient(90deg, #14B8A6, #2DD4BF)',
                width: `${((filledCount + (comment.trim() ? 1 : 0)) / 4) * 100}%`,
                transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {renderStars('Overall Rating', overallRating, setOverallRating, <ThumbsUp size={14} />)}
          {renderStars(
            'Work Environment',
            workEnvironmentRating,
            setWorkEnvironmentRating,
            <Building2 size={14} />
          )}
          {renderStars(
            'Learning Opportunity',
            learningOpportunityRating,
            setLearningOpportunityRating,
            <BookOpen size={14} />
          )}
        </div>

        {/* Written Feedback */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Written Feedback
          </label>
          <textarea
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 16px',
              borderRadius: 12,
              border: `1.5px solid ${comment.trim() ? 'rgba(13, 148, 136, 0.2)' : '#E8ECF1'}`,
              background: comment.trim() ? 'rgba(13, 148, 136, 0.02)' : '#FAFBFC',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              color: '#0F172A',
              outline: 'none',
              minHeight: 100,
              resize: 'vertical',
              lineHeight: 1.7,
              transition: 'all 0.3s ease',
            }}
            placeholder="Describe your internship experience. What did you learn? How was the team culture?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
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
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !allRated}
          style={{
            width: '100%',
            marginTop: 18,
            padding: '14px 20px',
            background: allRated ? 'linear-gradient(135deg, #0D9488, #0F766E)' : '#E2E8F0',
            color: allRated ? '#fff' : '#94A3B8',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            cursor: allRated && !isSubmitting ? 'pointer' : 'not-allowed',
            boxShadow: allRated ? '0 6px 20px rgba(13, 148, 136, 0.3)' : 'none',
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
            ? 'Submitting...'
            : allRated
              ? 'Submit Review'
              : 'Complete all fields to submit'}
        </button>
      </form>
    </div>
  );
}
