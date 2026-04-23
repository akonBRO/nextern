'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MentorProfileForm from '@/components/mentorship/MentorProfileForm';

export default function RegisterMentorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [existingMentor, setExistingMentor] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function checkExisting() {
      try {
        setLoading(true);
        const res = await fetch('/api/mentors/me');
        if (res.ok) {
          const data = await res.json();
          setExistingMentor(data);
          // If already a mentor, redirect to dashboard
          router.push('/student/mentorship/dashboard');
        } else {
          // Not a mentor yet, allow registration
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    checkExisting();
  }, [router]);

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>;
  }

  if (existingMentor) {
    return null; // Will redirect
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1E293B', margin: '0 0 8px 0' }}>
          Become a Mentor
        </h1>
        <p style={{ fontSize: 16, color: '#64748B', margin: 0 }}>
          Share your expertise and help guide the next generation of students.
        </p>
      </div>

      <MentorProfileForm isEdit={false} />
    </div>
  );
}
