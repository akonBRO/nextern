import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import styles from './DashboardContent.module.css';

const palette = {
  primary: '#087f72',
  indigo: '#182c39',
  cyan: '#087f72',
  text: '#182c39',
  muted: '#60717d',
  success: '#19805c',
  warning: '#a36b17',
  border: '#dfe6e9',
};
function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
function isHeroAsideStyle(style?: CSSProperties) {
  return (
    typeof style?.background === 'string' &&
    style.background.includes('rgba(255,255,255') &&
    typeof style?.border === 'string' &&
    style.border.includes('rgba(255,255,255')
  );
}

export function HeroAsideCard({
  children,
  style,
  contentStyle,
}: {
  children: ReactNode;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}) {
  return (
    <div className={styles.heroAside} style={style}>
      <div style={contentStyle}>{children}</div>
    </div>
  );
}
export function DashboardPage({ children }: { children: ReactNode }) {
  return <div className={`dashboard-page ${styles.page}`}>{children}</div>;
}
export function DashboardSection({
  id,
  title,
  description,
  action,
  children,
  headingLevel = 2,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section id={id} className={`dashboard-section ${styles.section}`}>
      <div className={`dashboard-section-header ${styles.sectionHeader}`}>
        <div className="dashboard-section-copy">
          <Heading className={`dashboard-section-title ${styles.sectionTitle}`}>{title}</Heading>
          {description && (
            <p className={`dashboard-section-description ${styles.description}`}>{description}</p>
          )}
        </div>
        {action && <div className={styles.sectionAction}>{action}</div>}
      </div>
      {children}
    </section>
  );
}
export function HeroCard({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  aside,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={`dashboard-hero-card ${styles.hero}`}>
      <div
        className={`dashboard-hero-grid ${styles.heroGrid} ${!aside ? styles.heroWithoutAside : ''}`}
      >
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={`dashboard-hero-title ${styles.heroTitle}`}>{title}</h1>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          <p className={`dashboard-hero-description ${styles.heroDescription}`}>{description}</p>
          {actions && (
            <div className={`dashboard-hero-actions ${styles.heroActions}`}>{actions}</div>
          )}
        </div>
        {aside && <div className={styles.heroAsideWrap}>{aside}</div>}
      </div>
    </div>
  );
}
export function ActionLink({
  href,
  label,
  tone = 'primary',
}: {
  href: string;
  label: string;
  tone?: 'primary' | 'ghost';
}) {
  return (
    <a
      href={href}
      className={`dashboard-action-link ${styles.actionLink} ${tone === 'ghost' ? styles.actionSecondary : ''}`}
    >
      {label}
    </a>
  );
}
export function StatCard({
  label,
  value,
  hint,
  Icon,
  accent = palette.primary,
  showIcon = true,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: LucideIcon;
  accent?: string;
  showIcon?: boolean;
}) {
  return (
    <div className={`dashboard-stat-card ${styles.stat}`}>
      <div className={styles.statHeader}>
        <span className={`dashboard-stat-label ${styles.statLabel}`}>{label}</span>
        {showIcon && (
          <span className={`dashboard-stat-icon ${styles.statIcon}`} style={{ color: accent }}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className={`dashboard-stat-value ${styles.statValue}`}>{value}</div>
      {hint && <p className={`dashboard-stat-hint ${styles.statHint}`}>{hint}</p>}
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  style,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`dashboard-panel ${styles.panel} ${isHeroAsideStyle(style) ? styles.heroAside : ''}`}
      style={style}
    >
      <div className={styles.panelHeader}>
        <div>
          <h3 className={`dashboard-panel-title ${styles.panelTitle}`}>{title}</h3>
          {description && (
            <p className={`dashboard-panel-description ${styles.description}`}>{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
export function Tag({
  label,
  tone = 'info',
}: {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'neutral';
}) {
  return <span className={`dashboard-tag ${styles.tag} ${styles[`tag_${tone}`]}`}>{label}</span>;
}
export function ProgressBar({
  value,
  label,
  tone = 'primary',
}: {
  value: number;
  label?: string;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const colors = { primary: palette.primary, success: palette.success, warning: palette.warning };
  return (
    <div className={styles.progress}>
      {label && (
        <div className={styles.progressLabel}>
          <span>{label}</span>
          <span>{clamp(value)}%</span>
        </div>
      )}
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label ?? 'Progress'}
        aria-valuenow={clamp(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${clamp(value)}%`, background: colors[tone] }} />
      </div>
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={`dashboard-empty-state ${styles.emptyState}`}>
      <Inbox size={26} strokeWidth={1.5} aria-hidden="true" />
      <div className={`dashboard-empty-state-title ${styles.emptyTitle}`}>{title}</div>
      <p className={`dashboard-empty-state-description ${styles.description}`}>{description}</p>
    </div>
  );
}

export function TrendLine({
  values,
  lineColor = palette.cyan,
  fillColor = 'rgba(34,211,238,0.14)',
}: {
  values: number[];
  lineColor?: string;
  fillColor?: string;
}) {
  if (values.length === 0) {
    return (
      <EmptyState
        title="No trend data yet"
        description="New score updates will appear here automatically."
      />
    );
  }

  const width = 460;
  const height = 210;
  const padding = 18;
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);

  const points = values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="210"
      role="img"
      aria-label="Trend line"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} />
          <stop offset="100%" stopColor="rgba(34,211,238,0.02)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx="20" fill="#F8FAFC" />
      {[0, 1, 2, 3].map((row) => {
        const y = padding + (row * (height - padding * 2)) / 3;
        return (
          <line
            key={row}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            stroke="#D9E2EC"
            strokeDasharray="5 7"
          />
        );
      })}
      <polygon points={areaPoints} fill="url(#trend-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((value, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return (
          <circle
            key={`${value}-${index}`}
            cx={x}
            cy={y}
            r="4.5"
            fill={lineColor}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        );
      })}
    </svg>
  );
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}

export function formatShortDate(value?: string) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatStatusLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDaysLeftLabel(daysLeft: number) {
  if (daysLeft < 0) return 'Closed';
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}
