'use client';

import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onFilterChange: (filters: { industry: string; expertise: string; mentorType: string }) => void;
}

export default function MentorFilterSidebar({ onFilterChange }: Props) {
  const [industry, setIndustry] = useState('');
  const [expertise, setExpertise] = useState('');
  const [mentorType, setMentorType] = useState('');

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

  const expertises = [
    'Software Engineering',
    'Product Management',
    'Data Science',
    'UX/UI Design',
    'Machine Learning',
    'Cybersecurity',
    'Cloud Computing',
    'Marketing',
    'Sales',
    'Consulting',
  ];

  function applyFilters(
    newFilters: Partial<{ industry: string; expertise: string; mentorType: string }>
  ) {
    const filters = { industry, expertise, mentorType, ...newFilters };
    onFilterChange(filters);
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: 24,
        position: 'sticky',
        top: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
            }}
          >
            <Filter size={18} strokeWidth={2} />
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>Filters</h2>
          {(industry || expertise || mentorType) && (
            <button
              onClick={() => {
                setIndustry('');
                setExpertise('');
                setMentorType('');
                applyFilters({ industry: '', expertise: '', mentorType: '' });
              }}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Clear <X size={14} />
            </button>
          )}
        </div>

        {/* Mentor Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#475569' }}>Type:</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: '', label: 'All' },
              { value: 'alumni', label: 'Alumni' },
              { value: 'professional', label: 'Professional' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setMentorType(type.value);
                  applyFilters({ mentorType: type.value });
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: mentorType === type.value ? '#2563EB' : '#E2E8F0',
                  background: mentorType === type.value ? '#EFF6FF' : '#FFFFFF',
                  color: mentorType === type.value ? '#1D4ED8' : '#64748B',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#475569' }}>Industry:</h3>
          <select
            value={industry}
            onChange={(e) => {
              setIndustry(e.target.value);
              applyFilters({ industry: e.target.value });
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#1E293B',
              fontSize: 14,
              fontWeight: 500,
              outline: 'none',
            }}
          >
            <option value="">Any Industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Expertise */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#475569' }}>Expertise:</h3>
          <select
            value={expertise}
            onChange={(e) => {
              setExpertise(e.target.value);
              applyFilters({ expertise: e.target.value });
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#1E293B',
              fontSize: 14,
              fontWeight: 500,
              outline: 'none',
            }}
          >
            <option value="">Any Expertise</option>
            {expertises.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
