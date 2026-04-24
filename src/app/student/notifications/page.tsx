import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Bell,
  Briefcase,
  CalendarClock,
  CalendarDays,
  MessageSquare,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';

const STUDENT_FILTER_TABS = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'status_update', label: 'Status', icon: <Briefcase size={13} /> },
  { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
  { value: 'job_match', label: 'Matches', icon: <Zap size={13} /> },
  { value: 'advisor_note', label: 'Advisor', icon: <Star size={13} /> },
  { value: 'interview_scheduled', label: 'Interviews', icon: <CalendarClock size={13} /> },
  { value: 'message_received', label: 'Messages', icon: <MessageSquare size={13} /> },
  { value: 'mentorship_request', label: 'Mentorship', icon: <Users size={13} /> },
];

export default async function StudentNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student' && session.user.role !== 'alumni') redirect('/login');

  const isMentor = session.user.role === 'alumni';

  return (
    <NotificationsPageClient
      dashboardHref={isMentor ? '/student/mentorship/dashboard' : '/student/dashboard'}
      title="Notifications"
      subtitle={
        isMentor
          ? 'Track mentorship requests, messages, and mentoring activity in one place.'
          : 'Track deadlines, employer updates, new matches, advisor notes, and interview activity.'
      }
      filterTabs={STUDENT_FILTER_TABS}
      defaultFilter={isMentor ? 'mentorship_request' : 'all'}
    />
  );
}
