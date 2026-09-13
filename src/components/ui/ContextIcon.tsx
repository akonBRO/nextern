import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FileText,
  Globe,
  GraduationCap,
  Laptop,
  Link,
  MapPin,
  MessageSquare,
  Paperclip,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  check: CheckCircle2,
  warning: CircleAlert,
  clipboard: ClipboardList,
  file: FileText,
  globe: Globe,
  graduation: GraduationCap,
  laptop: Laptop,
  link: Link,
  location: MapPin,
  message: MessageSquare,
  attachment: Paperclip,
  sparkle: Sparkles,
  target: Target,
  trophy: Trophy,
  tool: Wrench,
  zap: Zap,
};

/** Consistent inline icon for compact metadata, notices and status labels. */
export default function ContextIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = icons[name] ?? CircleAlert;
  return (
    <Icon
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: '-.18em', flexShrink: 0 }}
    />
  );
}
