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
  boardTitle?: string;
  boardSubtitle?: string;
  fullCalendarHref?: string | null;
  fullCalendarLabel?: string;
  manageCalendarHref?: string | null;
  connectedBadgeLabel?: string;
  disconnectedBadgeLabel?: string;
  showConnectionStatus?: boolean;
  eventHrefTemplate?: string;
  emptyNextEventMessage?: string;
};

type NormalizedEvent = UpcomingCalendarEvent & { dateObject: Date; dayKey: string };

const EVENT_STYLES = {
  interview: {
    accent: '#6366F1',
    soft: '#EEF2FF',
    border: '#C7D2FE',
    text: '#3730A3',
    dot: '#818CF8',
    label: 'Interview',
    pill: '#E0E7FF',
  },
  event_registration: {
    accent: '#0891B2',
    soft: '#ECFEFF',
    border: '#A5F3FC',
    text: '#0E7490',
    dot: '#22D3EE',
    label: 'Event',
    pill: '#CFFAFE',
  },
  deadline: {
    accent: '#F59E0B',
    soft: '#FFFBEB',
    border: '#FDE68A',
    text: '#B45309',
    dot: '#FBBF24',
    label: 'Deadline',
    pill: '#FEF3C7',
  },
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

function formatCalendarDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy');
}

function formatTimelineLabel(event: UpcomingCalendarEvent) {
  if (event.daysLeft <= 0) {
    return event.type === 'deadline' ? 'Due today' : 'Happening today';
  }
  if (event.daysLeft === 1) {
    return event.type === 'deadline' ? '1 day left' : 'Tomorrow';
  }
  return event.type === 'deadline' ? `${event.daysLeft} days left` : `In ${event.daysLeft} days`;
}

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function CalendarBoard({
  events,
  isCalendarConnected,
  mode = 'dashboard',
  boardTitle = 'Calendar Planner',
  boardSubtitle = 'Browse month by month, track interviews, deadlines, and registrations.',
  fullCalendarHref = '/student/calendar',
  fullCalendarLabel = 'Full calendar',
  manageCalendarHref = '/student/profile#calendar',
  connectedBadgeLabel = 'Google Calendar connected',
  disconnectedBadgeLabel = 'Google Calendar not connected',
  showConnectionStatus = true,
  eventHrefTemplate = '/student/applications',
  emptyNextEventMessage = 'No upcoming events yet. Apply to opportunities to fill this planner.',
}: Props) {
  const isDashboard = mode === 'dashboard';
  const isCalendarPage = mode === 'page';
  const allowEventLinks = !isCalendarPage;
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
  const upcomingAgenda = normalizedEvents
    .filter((event) => event.dateObject.getTime() >= startOfDay(new Date()).getTime())
    .slice(0, 5);

  function jumpToMonth(nextMonth: Date) {
    setVisibleMonth(startOfMonth(nextMonth));
    setSelectedDate(getPreferredDay(nextMonth, normalizedEvents));
  }

  function resolveEventHref(event: UpcomingCalendarEvent) {
    if (event.href) return event.href;

    const applicationId = event.applicationId ?? '';
    let href = eventHrefTemplate.replace(':jobId', event.jobId);

    if (href.includes(':applicationId')) {
      href = applicationId
        ? href.replace(':applicationId', applicationId)
        : href.replace('/:applicationId', '').replace(':applicationId', '');
    }

    if (!applicationId && href === '/student/applications') {
      return `/student/jobs/${event.jobId}`;
    }

    return href;
  }

  return (
    <div className="cb-root">
      {/* ── Header ── */}
      <div className={`cb-header ${showCalendar ? 'cb-header--open' : ''}`}>
        <div className="cb-header-inner">
          {/* Left: icon + title + badges */}
          <div className="cb-header-left">
            <div className={`cb-icon-wrap ${showCalendar ? 'cb-icon-wrap--lg' : ''}`}>
              <Calendar size={showCalendar ? 20 : 17} />
            </div>

            <div>
              <p
                className="cb-title"
                style={{ fontSize: mode === 'page' ? 22 : showCalendar ? 20 : 17 }}
              >
                {boardTitle}
              </p>
              <p className="cb-subtitle">{boardSubtitle}</p>

              <div className="cb-badges">
                {showConnectionStatus && (
                  <span
                    className={`cb-badge ${isCalendarConnected ? 'cb-badge--green' : 'cb-badge--amber'}`}
                  >
                    {isCalendarConnected ? <CalendarCheck size={12} /> : <Sparkles size={12} />}
                    {isCalendarConnected ? connectedBadgeLabel : disconnectedBadgeLabel}
                  </span>
                )}
                <span className="cb-badge cb-badge--neutral">
                  {normalizedEvents.length} event{normalizedEvents.length === 1 ? '' : 's'} loaded
                </span>
              </div>
            </div>
          </div>

          {/* Right: action buttons + toggle */}
          <div className="cb-header-right">
            {!isCalendarConnected && manageCalendarHref && (
              <Link href={manageCalendarHref} className="cb-btn cb-btn--connect">
                Connect Calendar <ArrowRight size={13} />
              </Link>
            )}
            {mode === 'dashboard' && fullCalendarHref && (
              <Link href={fullCalendarHref} className="cb-btn cb-btn--outline">
                {fullCalendarLabel} <ExternalLink size={13} />
              </Link>
            )}
            {isDashboard && (
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                aria-expanded={showCalendar}
                aria-label={showCalendar ? 'Hide calendar' : 'Show calendar'}
                className="cb-toggle"
              >
                {showCalendar ? (
                  <ChevronUp size={18} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={18} strokeWidth={2.5} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Calendar Body ── */}
      {showCalendar && (
        <div className={`cb-body ${mode === 'page' ? 'cb-body--page' : ''}`}>
          {/* Month nav */}
          <div className="cb-month-nav">
            <div>
              <p className="cb-month-label">{format(visibleMonth, 'MMMM yyyy')}</p>
              <p className="cb-month-sub">
                {monthEvents.length > 0
                  ? `${monthEvents.length} event${monthEvents.length === 1 ? '' : 's'} this month`
                  : 'No events this month'}
              </p>
            </div>
            <div className="cb-nav-controls">
              <button
                type="button"
                className="cb-today-btn"
                onClick={() => jumpToMonth(startOfMonth(new Date()))}
              >
                Today
              </button>
              <div className="cb-arrow-group">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="cb-arrow cb-arrow--prev"
                  onClick={() => jumpToMonth(addMonths(visibleMonth, -1))}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  className="cb-arrow cb-arrow--next"
                  onClick={() => jumpToMonth(addMonths(visibleMonth, 1))}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="cb-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="cb-weekday">
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="cb-grid">
            {visibleDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[dayKey] ?? [];
              const isCurrentMonth = isSameMonth(day, visibleMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              const hiddenCount = Math.max(0, dayEvents.length - 2);

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day);
                    if (!isCurrentMonth) setVisibleMonth(startOfMonth(day));
                  }}
                  className={[
                    'cb-day',
                    isSelected ? 'cb-day--selected' : '',
                    isTodayDay ? 'cb-day--today' : '',
                    !isCurrentMonth ? 'cb-day--other' : '',
                  ].join(' ')}
                >
                  <div className="cb-day-top">
                    <span className={`cb-day-num ${isTodayDay ? 'cb-day-num--today' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="cb-day-count">{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="cb-day-events">
                    {dayEvents.slice(0, 2).map((event) => {
                      const s = EVENT_STYLES[event.type];
                      return (
                        <div
                          key={event.id}
                          className="cb-event-chip"
                          style={{ background: s.soft, borderColor: s.border }}
                        >
                          <span className="cb-event-dot" style={{ background: s.dot }} />
                          <span className="cb-event-chip-label" style={{ color: s.text }}>
                            {event.title}
                          </span>
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && <span className="cb-day-more">+{hiddenCount} more</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary panels (page mode only) */}
          {isCalendarPage && (
            <div className="cb-summary">
              {/* Selected day panel */}
              <div className="cb-panel">
                <div className="cb-panel-head">
                  <div>
                    <p className="cb-panel-title">{format(selectedDate, 'EEEE, MMMM d')}</p>
                    <p className="cb-panel-sub">
                      {selectedEvents.length > 0
                        ? `${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'}`
                        : 'No events on this day'}
                    </p>
                  </div>
                  <div className="cb-month-badge">
                    <Clock3 size={12} />
                    {monthEvents.length} in {format(visibleMonth, 'MMM')}
                  </div>
                </div>

                <div className="cb-panel-events">
                  {selectedEvents.length > 0 ? (
                    selectedEvents.map((event) => {
                      const s = EVENT_STYLES[event.type];
                      return (
                        <div
                          key={event.id}
                          className={`cb-event-card ${allowEventLinks ? 'cb-event-card--link' : ''}`}
                          style={{ background: s.soft, borderColor: s.border }}
                        >
                          <div className="cb-event-card-top">
                            <span
                              className="cb-event-type-badge"
                              style={{ background: s.pill, color: s.text }}
                            >
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: s.accent,
                                  display: 'inline-block',
                                }}
                              />
                              {s.label}
                            </span>
                            <span className="cb-event-time">{formatEventTime(event)}</span>
                          </div>
                          <p className="cb-event-title">{event.title}</p>
                          <p className="cb-event-company">{event.companyName}</p>
                          <div className="cb-event-dates">
                            <div className="cb-event-date-row">
                              <span className="cb-event-date-label">
                                {event.dateLabel ??
                                  (event.type === 'deadline' ? 'Deadline' : 'Date')}
                              </span>
                              <span className="cb-event-date-value">
                                {formatCalendarDate(event.date)}
                              </span>
                            </div>
                            {event.secondaryDate && event.secondaryDateLabel && (
                              <div className="cb-event-date-row">
                                <span className="cb-event-date-label">
                                  {event.secondaryDateLabel}
                                </span>
                                <span className="cb-event-date-value">
                                  {formatCalendarDate(event.secondaryDate)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="cb-event-meta">
                            <span className="cb-event-meta-pill">{formatTimelineLabel(event)}</span>
                            <span className="cb-event-meta-pill">
                              {formatStatusLabel(event.status)}
                            </span>
                            <span className="cb-event-meta-pill">
                              {event.jobType ? formatStatusLabel(event.jobType) : 'Opportunity'}
                            </span>
                            <span
                              className={`cb-event-meta-pill ${event.isSynced ? 'cb-event-meta-pill--synced' : ''}`}
                            >
                              {event.isSynced ? 'Google synced' : 'Not synced'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="cb-empty-state">
                      Pick another day to view events. Use the month arrows to navigate forward or
                      backward.
                    </div>
                  )}
                </div>
              </div>

              {/* Coming up next */}
              <div className="cb-panel cb-panel--aside">
                <p className="cb-panel-title">Coming up next</p>
                <p className="cb-panel-sub" style={{ marginBottom: 16 }}>
                  Your nearest upcoming event
                </p>

                {nextUpcomingEvent ? (
                  <div
                    className="cb-next-event"
                    style={{
                      background: EVENT_STYLES[nextUpcomingEvent.type].soft,
                      borderColor: EVENT_STYLES[nextUpcomingEvent.type].border,
                    }}
                  >
                    <span
                      className="cb-next-type"
                      style={{ color: EVENT_STYLES[nextUpcomingEvent.type].text }}
                    >
                      {EVENT_STYLES[nextUpcomingEvent.type].label}
                    </span>
                    <p className="cb-next-title">{nextUpcomingEvent.title}</p>
                    <p className="cb-next-company">{nextUpcomingEvent.companyName}</p>
                    <p className="cb-next-date">
                      {format(new Date(nextUpcomingEvent.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    {nextUpcomingEvent.secondaryDate && nextUpcomingEvent.secondaryDateLabel && (
                      <p className="cb-next-subdate">
                        {nextUpcomingEvent.secondaryDateLabel}:{' '}
                        {formatCalendarDate(nextUpcomingEvent.secondaryDate)}
                      </p>
                    )}
                    <div className="cb-next-meta">
                      <span className="cb-next-meta-pill">
                        {formatTimelineLabel(nextUpcomingEvent)}
                      </span>
                      <span className="cb-next-meta-pill">
                        {formatStatusLabel(nextUpcomingEvent.status)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="cb-empty-state">{emptyNextEventMessage}</div>
                )}

                {upcomingAgenda.length > 0 && (
                  <div className="cb-agenda">
                    <div className="cb-agenda-head">
                      <p className="cb-panel-title">Upcoming agenda</p>
                      <p className="cb-panel-sub">
                        Your next five checkpoints across jobs and events
                      </p>
                    </div>
                    <div className="cb-agenda-list">
                      {upcomingAgenda.map((event) => {
                        const s = EVENT_STYLES[event.type];
                        return (
                          <div key={`agenda-${event.id}`} className="cb-agenda-item">
                            <span className="cb-agenda-date">
                              <span className="cb-agenda-date-day">
                                {format(new Date(event.date), 'd')}
                              </span>
                              <span className="cb-agenda-date-month">
                                {format(new Date(event.date), 'MMM')}
                              </span>
                            </span>
                            <span className="cb-agenda-body">
                              <span className="cb-agenda-title">{event.title}</span>
                              <span className="cb-agenda-sub">
                                <span style={{ color: s.text, fontWeight: 700 }}>{s.label}</span>
                                <span>{event.companyName}</span>
                                <span>{formatTimelineLabel(event)}</span>
                                {event.dateLabel ? <span>{event.dateLabel}</span> : null}
                                {event.secondaryDate && event.secondaryDateLabel ? (
                                  <span>
                                    {event.secondaryDateLabel}:{' '}
                                    {formatCalendarDate(event.secondaryDate)}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                            <span
                              className="cb-agenda-status"
                              style={{ background: s.soft, color: s.text, borderColor: s.border }}
                            >
                              {event.isSynced ? 'Synced' : 'Pending sync'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="cb-type-breakdown">
                  {countsByType.map(({ key, style, count }) => (
                    <div
                      key={key}
                      className="cb-type-row"
                      style={{ background: style.soft, borderColor: style.border }}
                    >
                      <span className="cb-type-row-label">
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: '50%',
                            background: style.accent,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: style.text, fontWeight: 600, fontSize: 13 }}>
                          {style.label}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: style.accent }}>
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
        /* ── Root ── */
        .cb-root {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          font-family: 'DM Sans', 'Inter', sans-serif;
        }

        /* ── Header ── */
        .cb-header {
          padding: 16px 20px 14px;
          background: #FAFAFA;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }
        .cb-header--open {
          border-bottom-color: #F3F4F6;
          background: #FAFAFA;
        }
        .cb-header-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cb-header-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .cb-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 2px;
        }

        /* ── Icon ── */
        .cb-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
          color: #4F46E5;
          border: 1px solid #C7D2FE;
          flex-shrink: 0;
        }
        .cb-icon-wrap--lg {
          width: 44px;
          height: 44px;
          border-radius: 14px;
        }

        /* ── Title / subtitle ── */
        .cb-title {
          margin: 0;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }
        .cb-subtitle {
          margin: 3px 0 0;
          font-size: 12px;
          color: #6B7280;
          line-height: 1.5;
        }

        /* ── Badges ── */
        .cb-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .cb-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .cb-badge--green {
          background: #F0FDF4;
          border-color: #BBF7D0;
          color: #15803D;
        }
        .cb-badge--amber {
          background: #FFFBEB;
          border-color: #FDE68A;
          color: #B45309;
        }
        .cb-badge--neutral {
          background: #F9FAFB;
          border-color: #E5E7EB;
          color: #374151;
        }

        /* ── Buttons ── */
        .cb-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 13px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .cb-btn--connect {
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          color: #4338CA;
        }
        .cb-btn--connect:hover { background: #E0E7FF; }
        .cb-btn--outline {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          color: #374151;
        }
        .cb-btn--outline:hover { background: #F9FAFB; }
        .cb-toggle {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #4F46E5;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cb-toggle:hover { background: #EEF2FF; }

        /* ── Body ── */
        .cb-body {
          padding: 20px;
        }
        .cb-body--page {
          padding: 24px 26px 28px;
        }

        /* ── Month nav ── */
        .cb-month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .cb-month-label {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.04em;
        }
        .cb-month-sub {
          margin: 3px 0 0;
          font-size: 12.5px;
          color: #9CA3AF;
        }
        .cb-nav-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cb-today-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #374151;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cb-today-btn:hover { background: #F3F4F6; }
        .cb-arrow-group {
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 3px;
          background: #FFFFFF;
        }
        .cb-arrow {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cb-arrow--prev { background: #F3F4F6; color: #374151; }
        .cb-arrow--prev:hover { background: #E5E7EB; }
        .cb-arrow--next { background: #4F46E5; color: #FFFFFF; }
        .cb-arrow--next:hover { background: #4338CA; }

        /* ── Weekday row ── */
        .cb-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
          margin-bottom: 6px;
        }
        .cb-weekday {
          padding: 6px 4px;
          font-size: 11px;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          text-align: center;
        }

        /* ── Grid ── */
        .cb-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
        }

        /* ── Day cell ── */
        .cb-day {
          text-align: left;
          padding: 10px;
          min-height: 118px;
          border-radius: 14px;
          border: 1px solid #F3F4F6;
          background: #FFFFFF;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        }
        .cb-day:hover {
          border-color: #C7D2FE;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(79, 70, 229, 0.08);
        }
        .cb-day--selected {
          border-color: #818CF8 !important;
          background: #F5F3FF !important;
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.12) !important;
        }
        .cb-day--other {
          opacity: 0.4;
        }

        /* ── Day number ── */
        .cb-day-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .cb-day-num {
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          color: #374151;
        }
        .cb-day-num--today {
          background: #4F46E5;
          color: #FFFFFF;
          border-radius: 8px;
        }
        .cb-day-count {
          font-size: 10px;
          font-weight: 700;
          color: #6366F1;
          background: #EEF2FF;
          border-radius: 999px;
          padding: 2px 6px;
        }

        /* ── Event chips ── */
        .cb-day-events {
          display: grid;
          gap: 4px;
          align-content: start;
        }
        .cb-event-chip {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          border-radius: 9px;
          border: 1px solid;
          padding: 5px 7px;
          min-width: 0;
          max-width: 100%;
        }
        .cb-event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .cb-event-chip-label {
          min-width: 0;
          flex: 1;
          font-size: 10.5px;
          font-weight: 700;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
          line-height: 1.3;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .cb-day-more {
          font-size: 10px;
          font-weight: 700;
          color: #9CA3AF;
          padding-left: 2px;
        }

        /* ── Summary panels ── */
        .cb-summary {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
          gap: 16px;
          margin-top: 20px;
        }
        @media (max-width: 1100px) {
          .cb-summary { grid-template-columns: 1fr; }
        }

        .cb-panel {
          border-radius: 18px;
          border: 1px solid #F3F4F6;
          background: #FFFFFF;
          padding: 20px;
        }
        .cb-panel--aside {
          background: #FAFAFA;
        }
        .cb-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .cb-panel-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.025em;
        }
        .cb-panel-sub {
          margin: 3px 0 0;
          font-size: 12px;
          color: #9CA3AF;
        }
        .cb-month-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid #E5E7EB;
          background: #F9FAFB;
          color: #6B7280;
          font-size: 11.5px;
          font-weight: 600;
        }

        /* ── Selected day event cards ── */
        .cb-panel-events {
          display: grid;
          gap: 10px;
        }
        .cb-event-card {
          display: block;
          border-radius: 14px;
          border: 1px solid;
          padding: 14px 16px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cb-event-card--link {
          text-decoration: none;
        }
        .cb-event-card--link:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        .cb-event-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .cb-event-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cb-event-time {
          font-size: 11.5px;
          color: #9CA3AF;
          font-weight: 500;
        }
        .cb-event-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }
        .cb-event-company {
          margin: 4px 0 0;
          font-size: 12.5px;
          color: #6B7280;
        }
        .cb-event-dates {
          display: grid;
          gap: 6px;
          margin-top: 10px;
        }
        .cb-event-date-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cb-event-date-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
        }
        .cb-event-date-value {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
        }
        .cb-event-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .cb-event-meta-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(255,255,255,0.66);
          padding: 4px 9px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }
        .cb-event-meta-pill--synced {
          border-color: #A7F3D0;
          background: #F0FDF4;
          color: #15803D;
        }

        /* ── Next event ── */
        .cb-next-event {
          border-radius: 14px;
          border: 1px solid;
          padding: 16px;
          margin-bottom: 14px;
        }
        .cb-next-type {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .cb-next-title {
          margin: 8px 0 0;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.025em;
          line-height: 1.3;
        }
        .cb-next-company {
          margin: 5px 0 0;
          font-size: 13px;
          color: #6B7280;
        }
        .cb-next-date {
          margin: 10px 0 0;
          font-size: 12px;
          color: #9CA3AF;
        }
        .cb-next-subdate {
          margin: 8px 0 0;
          font-size: 12px;
          color: #64748B;
          font-weight: 600;
        }
        .cb-next-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .cb-next-meta-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 10px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(148, 163, 184, 0.25);
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .cb-agenda {
          margin-bottom: 14px;
        }
        .cb-agenda-head {
          margin-bottom: 12px;
        }
        .cb-agenda-list {
          display: grid;
          gap: 10px;
          margin-bottom: 14px;
        }
        .cb-agenda-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          border-radius: 14px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          padding: 12px;
        }
        .cb-agenda-date {
          width: 48px;
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 0;
          color: #0F172A;
        }
        .cb-agenda-date-day {
          font-size: 17px;
          font-weight: 800;
          line-height: 1;
        }
        .cb-agenda-date-month {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748B;
          margin-top: 4px;
        }
        .cb-agenda-body {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .cb-agenda-title {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cb-agenda-sub {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 11.5px;
          color: #64748B;
        }
        .cb-agenda-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid;
          padding: 5px 9px;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        /* ── Type breakdown rows ── */
        .cb-type-breakdown {
          display: grid;
          gap: 8px;
        }
        .cb-type-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-radius: 11px;
          border: 1px solid;
          padding: 9px 12px;
        }
        .cb-type-row-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        /* ── Empty state ── */
        .cb-empty-state {
          border-radius: 12px;
          border: 1px dashed #E5E7EB;
          background: #F9FAFB;
          padding: 16px;
          color: #9CA3AF;
          font-size: 13px;
          line-height: 1.65;
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .cb-grid {
            overflow-x: auto;
            grid-template-columns: repeat(7, minmax(108px, 1fr));
          }
        }
        @media (max-width: 640px) {
          .cb-day {
            min-height: 104px !important;
            padding: 8px !important;
          }
          .cb-event-chip-label {
            font-size: 10px;
          }
          .cb-body { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
