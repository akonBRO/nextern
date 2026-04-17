'use client';

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
};

export default function TeacherStudentDashboardLauncher({
  students,
  defaultStudentId,
  dashboardBasePath,
}: Props) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(defaultStudentId ?? students[0]?.id ?? '');

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
            fontWeight: 800,
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
          style={{
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: 14,
            border: '1px solid #CBD5E1',
            padding: '12px 14px',
            fontSize: 14,
            color: '#0F172A',
            background: '#FFFFFF',
            outline: 'none',
          }}
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} · {student.opportunityScore}% score
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={!studentId}
        style={{
          border: 'none',
          borderRadius: 14,
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 800,
          cursor: studentId ? 'pointer' : 'not-allowed',
        }}
      >
        Open student dashboard
      </button>
    </form>
  );
}
