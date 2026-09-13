'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type StudentOption = {
  id: string;
  name: string;
  opportunityScore: number;
};

type Props = {
  students: StudentOption[];
  defaultStudentId?: string;
  dashboardBasePath: string;
  directoryHref?: string;
};

export default function TeacherStudentDashboardLauncher({
  students,
  defaultStudentId,
  dashboardBasePath,
  directoryHref,
}: Props) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(defaultStudentId ?? '');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!studentId) return;
        router.push(`${dashboardBasePath}/${studentId}/dashboard`);
      }}
      style={{ display: 'grid', gap: 14 }}
    >
      <label style={{ display: 'grid', gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          Student
        </span>
        <select
          name="studentId"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: 14,
            border: '1px solid #CBD5E1',
            padding: '12px 14px',
            fontSize: 14,
            color: '#182c39',
            background: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="">Choose a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} · {student.opportunityScore}% score
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10 }}>
        <button
          type="submit"
          disabled={!studentId}
          style={{
            border: 'none',
            borderRadius: 14,
            padding: '12px 16px',
            background: 'var(--primary)',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 700,
            cursor: studentId ? 'pointer' : 'not-allowed',
          }}
        >
          Open student dashboard
        </button>
        {directoryHref ? (
          <Link
            href={directoryHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              border: '1px solid #bdddd5',
              background: '#edf7f3',
              color: '#06665d',
              padding: '12px 14px',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Open directory
          </Link>
        ) : null}
      </div>
    </form>
  );
}
