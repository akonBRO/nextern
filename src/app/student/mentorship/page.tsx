'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, LayoutDashboard, CalendarDays } from 'lucide-react';
import MentorCard from '@/components/mentorship/MentorCard';
import MentorFilterSidebar from '@/components/mentorship/MentorFilterSidebar';
import RequestSessionModal from '@/components/mentorship/RequestSessionModal';

export default function BrowseMentorsPage() {
  const [mentors, setMentors] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ industry: '', expertise: '', mentorType: '' });

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.industry) params.set('industry', filters.industry);
        if (filters.expertise) params.set('expertise', filters.expertise);
        if (filters.mentorType) params.set('mentorType', filters.mentorType);

        const res = await fetch(`/api/mentors?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMentors(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMentors();
  }, [filters]);

  function handleRequestSession(mentorId: string) {
    setSelectedMentorId(mentorId);
    setRequestModalOpen(true);
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 40,
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#1E293B',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Users size={32} color="#2563EB" />
            Alumni Mentorship Network
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: 0, maxWidth: 600 }}>
            Connect with experienced alumni and industry professionals. Book 1:1 video sessions for
            career guidance, interview prep, and technical help.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/student/mentorship/sessions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 12,
              background: '#FFFFFF',
              color: '#475569',
              fontWeight: 700,
              fontSize: 14,
              border: '1px solid #E2E8F0',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <CalendarDays size={18} />
            My Sessions
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <MentorFilterSidebar onFilterChange={setFilters} />
        <div>
          {loading ? (
            <div
              style={{ display: 'flex', justifyContent: 'center', padding: 80, color: '#94A3B8' }}
            >
              Loading mentors...
            </div>
          ) : mentors.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 24,
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
            >
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor._id}
                  mentor={mentor}
                  onRequestSession={handleRequestSession}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 20,
                border: '2px dashed #E2E8F0',
                padding: 60,
                textAlign: 'center',
              }}
            >
              <Users
                size={48}
                color="#94A3B8"
                style={{ margin: '0 auto 16px auto', display: 'block' }}
              />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '0 0 8px 0' }}>
                No mentors found
              </h3>
              <p
                style={{
                  color: '#64748B',
                  margin: 0,
                  maxWidth: 300,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                Try adjusting your filters to find the right mentor for you.
              </p>
            </div>
          )}
        </div>
      </div>

      {requestModalOpen && selectedMentorId && (
        <RequestSessionModal
          isOpen={requestModalOpen}
          mentorId={selectedMentorId}
          onClose={() => setRequestModalOpen(false)}
          onSuccess={() => {
            setRequestModalOpen(false);
            window.location.href = '/student/mentorship/sessions';
          }}
        />
      )}
    </div>
  );
}
