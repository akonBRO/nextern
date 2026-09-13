import Image from 'next/image';
import { Award } from 'lucide-react';

export default function BadgeIcon({
  value,
  label,
  size = 24,
}: {
  value?: string;
  label: string;
  size?: number;
}) {
  return value && /^https?:\/\//.test(value) ? (
    <Image
      src={value}
      alt={label}
      width={size}
      height={size}
      unoptimized
      style={{ objectFit: 'contain' }}
    />
  ) : (
    <Award size={size} strokeWidth={1.7} aria-label={label} color="#5c8245" />
  );
}
