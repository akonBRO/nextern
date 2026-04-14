'use client';

import type { UpcomingCalendarEvent } from '@/lib/calendar-events';
import CalendarBoard from './CalendarBoard';

type Props = {
  events: UpcomingCalendarEvent[];
  isCalendarConnected: boolean;
};

export default function CalendarWidget({ events, isCalendarConnected }: Props) {
  return (
    <CalendarBoard events={events} isCalendarConnected={isCalendarConnected} mode="dashboard" />
  );
}
