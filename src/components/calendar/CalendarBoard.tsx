'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { UpcomingCalendarEvent } from '@/lib/calendar-events';

type Props = {
  events: UpcomingCalendarEvent[];
  isCalendarConnected: boolean;
  mode?: 'dashboard' | 'page';
};

type NormalizedEvent = UpcomingCalendarEvent & { dateObject: Date; dayKey: string };

const EVENT_STYLES = {
  interview: { accent: '#7C3AED', soft: '#F5F3FF', border: '#DDD6FE', label: 'Interview' },
  event_registration: { accent: '#0D9488', soft: '#F0FDFA', border: '#99F6E4', label: 'Event' },
  deadline: { accent: '#EA580C', soft: '#FFF7ED', border: '#FED7AA', label: 'Deadline' },
} as const;

const EVENT_STYLE_ENTRIES = Object.entries(EVENT_STYLES) as Array<
  [keyof typeof EVENT_STYLES, (typeof EVENT_STYLES)[keyof typeof EVENT_STYLES]]
>;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizeEventDate(iso: string) {
  return startOfDay(new Date(iso));
}

function getInitialMonth(events: NormalizedEvent[]) {
  const today = startOfDay(new Date());
  const thisMonthEvent = events.find((event) => isSameMonth(event.dateObject, today));
  return startOfMonth(thisMonthEvent?.dateObject ?? events[0]?.dateObject ?? today);
}

function getPreferredDay(month: Date, events: NormalizedEvent[]) {
  const monthEvent = events.find((event) => isSameMonth(event.dateObject, month));
  return monthEvent?.dateObject ?? startOfMonth(month);
}

function formatEventTime(event: UpcomingCalendarEvent) {
  const date = new Date(event.date);
  return event.type === 'deadline' ? format(date, 'MMM d') : format(date, 'MMM d, h:mm a');
}

export default function CalendarBoard({ events, isCalendarConnected, mode = 'dashboard' }: Props) {
  const isDashboard = mode === 'dashboard';
  const isCalendarPage = mode === 'page';
  const normalizedEvents = events
    .map((event) => {
      const dateObject = normalizeEventDate(event.date);
      return { ...event, dateObject, dayKey: format(dateObject, 'yyyy-MM-dd') };
    })
    .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());

  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(normalizedEvents));
  const [selectedDate, setSelectedDate] = useState(() =>
    getPreferredDay(getInitialMonth(normalizedEvents), normalizedEvents)
  );
  const [isExpanded, setIsExpanded] = useState(mode === 'page');

  const gridStart = startOfWeek(startOfMonth(visibleMonth));
  const gridEnd = endOfWeek(endOfMonth(visibleMonth));
  const visibleDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const eventsByDay = normalizedEvents.reduce<Record<string, NormalizedEvent[]>>((acc, event) => {
    if (!acc[event.dayKey]) acc[event.dayKey] = [];
    acc[event.dayKey].push(event);
    return acc;
  }, {});

  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = eventsByDay[selectedDayKey] ?? [];
  const monthEvents = normalizedEvents.filter((event) =>
    isSameMonth(event.dateObject, visibleMonth)
  );
  const nextUpcomingEvent =
    normalizedEvents.find(
      (event) => event.dateObject.getTime() >= startOfDay(new Date()).getTime()
    ) ?? normalizedEvents[0];
  const showCalendar = isCalendarPage || isExpanded;
  const countsByType = EVENT_STYLE_ENTRIES.map(([key, style]) => ({
    key,
    style,
    count: normalizedEvents.filter((event) => event.type === key).length,
  })).filter((entry) => entry.count > 0);

  function jumpToMonth(nextMonth: Date) {
    setVisibleMonth(startOfMonth(nextMonth));
    setSelectedDate(getPreferredDay(nextMonth, normalizedEvents));
  }

  return (
    <div
      style={{
        borderRadius: mode === 'page' ? 28 : showCalendar ? 22 : 20,
        overflow: 'hidden',
        border: '1px solid #E7E5E4',
        background: '#FFFFFF',
        boxShadow: showCalendar
          ? '0 18px 45px rgba(15,23,42,0.08)'
          : '0 12px 28px rgba(15,23,42,0.05)',
      }}
    >
      <div
        style={{
          padding:
            mode === 'page' ? '22px 24px 18px' : showCalendar ? '16px 16px 14px' : '14px 14px 12px',
          background: '#FFFBF7',
          borderBottom: showCalendar ? '1px solid #F3E1D4' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: showCalendar ? 12 : 10 }}>
              <div
                style={{
                  width: showCalendar ? 44 : 38,
                  height: showCalendar ? 44 : 38,
                  borderRadius: showCalendar ? 14 : 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C2410C',
                  background: '#FFF1E8',
                  border: '1px solid #FED7AA',
                }}
              >
                <Calendar size={showCalendar ? 20 : 18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: mode === 'page' ? 24 : showCalendar ? 22 : 20,
                    fontWeight: 900,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Calendar Planner
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: showCalendar ? 13 : 12,
                    color: '#57534E',
                    lineHeight: 1.55,
                    maxWidth: showCalendar ? 640 : 560,
                  }}
                >
                  Browse month by month, see deadlines on the correct day, and keep your
                  applications and interviews in one place.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: showCalendar ? 16 : 12,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 999,
                  padding: '6px 11px',
                  background: isCalendarConnected ? '#ECFDF5' : '#FFF7ED',
                  border: isCalendarConnected ? '1px solid #A7F3D0' : '1px solid #FED7AA',
                  color: isCalendarConnected ? '#047857' : '#9A3412',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {isCalendarConnected ? <CalendarCheck size={13} /> : <Sparkles size={13} />}
                {isCalendarConnected
                  ? 'Google Calendar connected'
                  : 'Google Calendar not connected'}
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 999,
                  padding: '6px 11px',
                  background: '#FFFFFF',
                  border: '1px solid #E7E5E4',
                  color: '#44403C',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {normalizedEvents.length} event{normalizedEvents.length === 1 ? '' : 's'} loaded
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
                marginTop: 6,
              }}
            >
              {!isCalendarConnected && (
                <Link
                  href="/student/profile#calendar"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: showCalendar ? '10px 14px' : '8px 12px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#7C2D12',
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                  }}
                >
                  Connect Google Calendar <ArrowRight size={14} />
                </Link>
              )}

              {mode === 'dashboard' && (
                <Link
                  href="/student/calendar"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: showCalendar ? '10px 14px' : '8px 12px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#44403C',
                    background: '#FFFFFF',
                    border: '1px solid #E7E5E4',
                  }}
                >
                  Open full calendar <ExternalLink size={14} />
                </Link>
              )}
            </div>

            {isDashboard && (
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                aria-expanded={showCalendar}
                aria-label={showCalendar ? 'Hide calendar' : 'Show calendar'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  color: '#9A3412',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  padding: 0,
                }}
              >
                {showCalendar ? (
                  <ChevronUp size={24} strokeWidth={2.6} />
                ) : (
                  <ChevronDown size={24} strokeWidth={2.6} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCalendar && (
        <div style={{ padding: mode === 'page' ? '24px 26px 26px' : '16px 16px 18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: mode === 'page' ? 28 : 24,
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.04em',
                }}
              >
                {format(visibleMonth, 'MMMM yyyy')}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                {monthEvents.length > 0
                  ? `${monthEvents.length} event${monthEvents.length === 1 ? '' : 's'} in view`
                  : 'No events scheduled in this month yet'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => jumpToMonth(startOfMonth(new Date()))}
                style={{
                  borderRadius: 11,
                  border: '1px solid #FED7AA',
                  background: '#FFF7ED',
                  color: '#9A3412',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '9px 12px',
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 4,
                  borderRadius: 14,
                  border: '1px solid #FED7AA',
                  background: '#FFFFFF',
                }}
              >
                <button
                  type="button"
                  onClick={() => jumpToMonth(addMonths(visibleMonth, -1))}
                  aria-label="Previous month"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: '#FFF7ED',
                    color: '#9A3412',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => jumpToMonth(addMonths(visibleMonth, 1))}
                  aria-label="Next month"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: '#C2410C',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 8,
              marginBottom: 8,
            }}
          >
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                style={{
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#78716C',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-board-grid">
            {visibleDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[dayKey] ?? [];
              const isCurrentMonth = isSameMonth(day, visibleMonth);
              const isSelected = isSameDay(day, selectedDate);
              const hiddenCount = Math.max(0, dayEvents.length - 2);
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day);
                    if (!isCurrentMonth) setVisibleMonth(startOfMonth(day));
                  }}
                  className="calendar-day-cell"
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    minHeight: 92,
                    borderRadius: 18,
                    border: isSelected ? '1.5px solid #F59E0B' : '1px solid #E7E5E4',
                    background: isSelected ? '#FFF7ED' : '#FFFFFF',
                    cursor: 'pointer',
                    transition:
                      'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
                    boxShadow: isSelected ? '0 14px 26px rgba(245,158,11,0.14)' : 'none',
                    opacity: isCurrentMonth ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        color: isToday(day) ? '#FFFFFF' : '#0F172A',
                        background: isToday(day) ? '#F59E0B' : 'transparent',
                      }}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#9A3412',
                          background: '#FFF7ED',
                          borderRadius: 999,
                          padding: '4px 7px',
                        }}
                      >
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: 6 }}>
                    {dayEvents.slice(0, 2).map((event) => {
                      const style = EVENT_STYLES[event.type];
                      return (
                        <div
                          key={event.id}
                          style={{
                            borderRadius: 12,
                            border: `1px solid ${style.border}`,
                            background: style.soft,
                            padding: '7px 8px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: style.accent,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: style.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {style.label}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#0F172A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </div>
                        </div>
                      );
                    })}

                    {hiddenCount > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#78716C',
                          padding: '2px 4px',
                        }}
                      >
                        +{hiddenCount} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {isCalendarPage && (
            <div className="calendar-board-summary">
              <div
                style={{
                  borderRadius: 22,
                  border: '1px solid #F3E1D4',
                  background: '#FFFFFF',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                      {selectedEvents.length > 0
                        ? `${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'} on this day`
                        : 'No events scheduled on the selected day'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 999,
                      padding: '7px 11px',
                      background: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      color: '#9A3412',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <Clock3 size={13} />
                    {monthEvents.length} in {format(visibleMonth, 'MMMM')}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {selectedEvents.length > 0 ? (
                    selectedEvents.map((event) => {
                      const style = EVENT_STYLES[event.type];
                      return (
                        <Link
                          key={event.id}
                          href="/student/applications"
                          style={{
                            display: 'block',
                            textDecoration: 'none',
                            borderRadius: 18,
                            border: `1px solid ${style.border}`,
                            background: style.soft,
                            padding: 16,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: style.accent,
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                              }}
                            >
                              <span
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: '50%',
                                  background: style.accent,
                                }}
                              />
                              {style.label}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>
                              {formatEventTime(event)}
                            </span>
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 16,
                              color: '#0F172A',
                              fontWeight: 800,
                            }}
                          >
                            {event.title}
                          </div>
                          <div
                            style={{
                              marginTop: 5,
                              fontSize: 13,
                              color: '#475569',
                              lineHeight: 1.6,
                            }}
                          >
                            {event.companyName}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        borderRadius: 18,
                        border: '1px dashed #E7E5E4',
                        background: '#FFFBF7',
                        padding: 18,
                        color: '#57534E',
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      Pick another day to inspect its events. If this month is empty, use the month
                      arrows to move forward or backward.
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 22,
                  border: '1px solid #F3E1D4',
                  background: '#FFFDFB',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Coming Up Next
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                  A quick summary of the next important date in your application journey.
                </div>

                <div style={{ marginTop: 18 }}>
                  {nextUpcomingEvent ? (
                    <div
                      style={{
                        borderRadius: 20,
                        padding: 18,
                        background: EVENT_STYLES[nextUpcomingEvent.type].soft,
                        border: `1px solid ${EVENT_STYLES[nextUpcomingEvent.type].border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: EVENT_STYLES[nextUpcomingEvent.type].accent,
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {EVENT_STYLES[nextUpcomingEvent.type].label}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 20,
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '-0.03em',
                          color: '#0F172A',
                        }}
                      >
                        {nextUpcomingEvent.title}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 14, color: '#475569' }}>
                        {nextUpcomingEvent.companyName}
                      </div>
                      <div style={{ marginTop: 14, fontSize: 13, color: '#64748B' }}>
                        {format(new Date(nextUpcomingEvent.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRadius: 18,
                        border: '1px dashed #E7E5E4',
                        background: '#FFFFFF',
                        padding: 18,
                        color: '#57534E',
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      You do not have any loaded calendar events yet. Apply to opportunities or
                      register for events to fill this planner.
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                  {countsByType.map(({ key, style, count }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        borderRadius: 14,
                        border: `1px solid ${style.border}`,
                        background: style.soft,
                        padding: '10px 12px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#1E293B',
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: style.accent,
                          }}
                        />
                        {style.label}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: style.accent }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .calendar-board-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
        }
        .calendar-day-cell:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 22px rgba(15, 23, 42, 0.08);
        }
        .calendar-board-summary {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
          gap: 16px;
          margin-top: 18px;
        }
        @media (max-width: 1100px) {
          .calendar-board-summary {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 860px) {
          .calendar-board-grid {
            overflow-x: auto;
            display: grid;
            grid-template-columns: repeat(7, minmax(108px, 1fr));
          }
        }
        @media (max-width: 640px) {
          .calendar-day-cell {
            min-height: 88px !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
