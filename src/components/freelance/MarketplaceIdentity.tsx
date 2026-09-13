import { Braces, ChartNoAxesCombined, Layers3, PenLine, Palette, Video } from 'lucide-react';

export function MarketplaceIdentity() {
  return (
    <span className="market-identity">
      <strong>
        nextern<span>.</span>
      </strong>
      <i aria-hidden="true" />
      <span>Freelancing</span>
    </span>
  );
}

export function CategoryIcon({ category, size = 22 }: { category: string; size?: number }) {
  const Icon =
    (
      {
        'web-dev': Braces,
        'graphic-design': Palette,
        'content-writing': PenLine,
        'data-analysis': ChartNoAxesCombined,
        'video-editing': Video,
      } as Record<string, typeof Braces>
    )[category] ?? Layers3;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
