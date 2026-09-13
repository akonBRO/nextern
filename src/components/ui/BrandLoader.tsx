import { NexternLogoMark } from '@/components/brand/NexternLogo';
import styles from './BrandLoader.module.css';

type BrandLoaderProps = {
  label?: string;
  variant?: 'page' | 'section' | 'inline';
};

/** One indeterminate loading identity for routes, panels, and small operations. */
export default function BrandLoader({
  label = 'Getting things ready',
  variant = 'section',
}: BrandLoaderProps) {
  const Container = variant === 'inline' ? 'span' : 'div';
  return (
    <Container className={`${styles.loader} ${styles[variant]}`} role="status" aria-live="polite">
      <span className={styles.identity} aria-hidden="true">
        <span className={styles.mark}>
          <NexternLogoMark alt="" size={variant === 'inline' ? 24 : 40} />
        </span>
        {variant !== 'inline' && (
          <span className={styles.wordmark}>
            nextern<span>.</span>
          </span>
        )}
      </span>
      <span className={styles.label}>{label.replace(/[.\u2026]+$/, '')}</span>
      <span className={styles.track} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </Container>
  );
}
