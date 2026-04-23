'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle } from 'lucide-react';

interface MentorProfile {
  _id?: string;
  expertise: string[];
  industry: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  bio: string;
  monthlySessionLimit: number;
  isAvailable: boolean;
  linkedinUrl?: string;
}

interface Props {
  initialData?: MentorProfile;
  isEdit?: boolean;
}

export default function MentorProfileForm({ initialData, isEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MentorProfile>({
    expertise: initialData?.expertise || [],
    industry: initialData?.industry || '',
    currentRole: initialData?.currentRole || '',
    currentCompany: initialData?.currentCompany || '',
    yearsOfExperience: initialData?.yearsOfExperience || 1,
    bio: initialData?.bio || '',
    monthlySessionLimit: initialData?.monthlySessionLimit || 4,
    isAvailable: initialData?.isAvailable ?? true,
    linkedinUrl: initialData?.linkedinUrl || '',
  });

  const [expertiseInput, setExpertiseInput] = useState('');

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Marketing',
    'Design',
    'Engineering',
    'Other',
  ];

  function handleAddExpertise(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = expertiseInput.trim();
      if (val && !formData.expertise.includes(val)) {
        setFormData({ ...formData, expertise: [...formData.expertise, val] });
      }
      setExpertiseInput('');
    }
  }

  function handleRemoveExpertise(skill: string) {
    setFormData({ ...formData, expertise: formData.expertise.filter((s) => s !== skill) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.expertise.length === 0) {
      setError('Please add at least one area of expertise.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = isEdit ? `/api/mentors/${initialData?._id}` : '/api/mentors';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save mentor profile.');
      }

      router.push('/student/mentorship/dashboard');
      router.refresh();
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#FFFFFF',
        padding: 32,
        borderRadius: 24,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 800, color: '#1E293B' }}>
        {isEdit ? 'Edit Mentor Profile' : 'Complete Mentor Profile'}
      </h2>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            padding: 16,
            borderRadius: 12,
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            color: '#DC2626',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
            }}
          >
            Current Role *
          </label>
          <input
            type="text"
            required
            value={formData.currentRole}
            onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
            }}
          >
            Company *
          </label>
          <input
            type="text"
            required
            value={formData.currentCompany}
            onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
            placeholder="e.g. Google"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
            }}
          >
            Industry *
          </label>
          <select
            required
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              outline: 'none',
            }}
          >
            <option value="">Select Industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
            }}
          >
            Years of Experience *
          </label>
          <input
            type="number"
            min={0}
            required
            value={formData.yearsOfExperience}
            onChange={(e) =>
              setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })
            }
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: '#475569',
            marginBottom: 8,
          }}
        >
          Expertise (Press Enter to add) *
        </label>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {formData.expertise.map((skill) => (
            <span
              key={skill}
              style={{
                background: '#DBEAFE',
                color: '#1D4ED8',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveExpertise(skill)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#1D4ED8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyDown={handleAddExpertise}
            placeholder="e.g. React, Python"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              flex: 1,
              minWidth: 120,
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: '#475569',
            marginBottom: 8,
          }}
        >
          Bio *
        </label>
        <textarea
          required
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell students about yourself, your career path, and how you can help them..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
            }}
          >
            Monthly Session Limit
          </label>
          <input
            type="number"
            min={1}
            max={20}
            required
            value={formData.monthlySessionLimit}
            onChange={(e) =>
              setFormData({ ...formData, monthlySessionLimit: parseInt(e.target.value) || 4 })
            }
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              outline: 'none',
            }}
          />
          <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#94A3B8' }}>
            Maximum sessions you want to conduct per month.
          </p>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              marginBottom: 8,
            }}
          >
            LinkedIn URL (Optional)
          </label>
          <input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: '#2563EB' }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
            I am currently available for new mentorship sessions
          </span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
          }}
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
