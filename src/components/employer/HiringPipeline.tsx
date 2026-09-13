import type { CSSProperties } from 'react';
import { formatCompactNumber } from '@/components/dashboard/DashboardContent';
import styles from './HiringPipeline.module.css';

type Props = {
  pipeline: { label: string; count: number }[];
  stats: { totalApplications: number; shortlisted: number; interviews: number; hired: number };
};

export default function HiringPipeline({ pipeline, stats }: Props) {
  const pipelineMax = Math.max(1, ...pipeline.map((stage) => stage.count));
  const colors = ['#087f72', '#178d80', '#a86714', '#168257'];
  const metrics = [
    {
      label: 'Application → Shortlist',
      numerator: stats.shortlisted,
      denominator: stats.totalApplications,
      color: '#178d80',
      desc: 'of applicants made it to review',
    },
    {
      label: 'Shortlist → Interview',
      numerator: stats.interviews,
      denominator: stats.shortlisted,
      color: '#a86714',
      desc: 'of shortlisted reached interview',
    },
    {
      label: 'Interview → Hire',
      numerator: stats.hired,
      denominator: stats.interviews,
      color: '#168257',
      desc: 'of interviews resulted in hire',
    },
    {
      label: 'Overall hire rate',
      numerator: stats.hired,
      denominator: stats.totalApplications,
      color: '#436b64',
      desc: 'of all applicants were hired',
    },
  ];
  return (
    <div className={styles.layout}>
      <article className={styles.panel} aria-labelledby="pipeline-counts-title">
        <div className={styles.heading}>
          <h3 id="pipeline-counts-title">Pipeline stage counts</h3>
          <p>Application volume at each stage of your hiring journey.</p>
        </div>
        <div
          className={styles.stages}
          style={{ '--stage-count': pipeline.length || 1 } as CSSProperties}
        >
          {pipeline.map((stage, index) => {
            const pct =
              stats.totalApplications > 0
                ? Math.round((stage.count / stats.totalApplications) * 100)
                : 0;
            const height = stage.count > 0 ? Math.max(18, (stage.count / pipelineMax) * 100) : 6;
            return (
              <div
                className={styles.stage}
                key={stage.label}
                style={{ '--stage-color': colors[index % colors.length] } as CSSProperties}
              >
                <strong className={styles.stageCount}>{formatCompactNumber(stage.count)}</strong>
                <span className={styles.stageShare}>{pct}% of total</span>
                <div className={styles.barTrack} aria-hidden="true">
                  <div style={{ height: `${height}%` }} />
                </div>
                <span className={styles.stageLabel}>{stage.label}</span>
              </div>
            );
          })}
        </div>
        <p className={styles.panelNote}>
          {stats.totalApplications === 0
            ? 'Stage counts will update as applications arrive.'
            : `${formatCompactNumber(stats.totalApplications)} applications across your roles.`}
        </p>
      </article>
      <article className={styles.panel} aria-labelledby="pipeline-conversion-title">
        <div className={styles.heading}>
          <h3 id="pipeline-conversion-title">Conversion metrics</h3>
          <p>How applicants progress from their first application to a hire.</p>
        </div>
        <div className={styles.metrics}>
          {metrics.map((metric) => {
            const pct =
              metric.denominator > 0
                ? Math.round((metric.numerator / metric.denominator) * 100)
                : 0;
            return (
              <div
                className={styles.metric}
                key={metric.label}
                style={{ '--stage-color': metric.color } as CSSProperties}
              >
                <h4>{metric.label}</h4>
                <div className={styles.metricValue}>
                  <strong>
                    {pct}
                    <small>%</small>
                  </strong>
                  <span>
                    {metric.numerator} / {metric.denominator}
                  </span>
                </div>
                <div className={styles.metricTrack} aria-hidden="true">
                  <div style={{ width: `${pct}%` }} />
                </div>
                <p>{metric.desc}</p>
              </div>
            );
          })}
        </div>
        <p className={styles.panelNote}>
          {stats.totalApplications === 0
            ? 'No applications yet. Conversion rates will update when candidates apply.'
            : 'Rates reflect the current application statuses in your pipeline.'}
        </p>
      </article>
    </div>
  );
}
