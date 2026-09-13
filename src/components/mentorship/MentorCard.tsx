'use client';

import Link from 'next/link';
import { Star, Briefcase, Building, BadgeCheck, ArrowUpRight } from 'lucide-react';
import './mentorship.css';

interface Mentor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
    email: string;
  };
  expertise: string[];
  industry: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  averageRating: number;
  totalSessions: number;
  isAvailable: boolean;
  mentorType: 'alumni' | 'professional';
  graduatedFrom?: string;
  badges?: { badgeName: string; badgeIcon: string }[];
}

interface Props {
  mentor: Mentor;
  onRequestSession: (mentorId: string) => void;
}

export default function MentorCard({ mentor, onRequestSession }: Props) {
  return (
    <article className="mentor-card">
      <div className="mentor-card-person">
        {mentor.userId?.image ? (
          <img src={mentor.userId.image} alt={mentor.userId.name} className="mentor-card-avatar" />
        ) : (
          <div className="mentor-card-avatar mentor-card-initial" aria-hidden="true">
            {mentor.userId?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
        )}
        <div className="mentor-card-identity">
          <div className="mentor-card-kind">
            {mentor.mentorType === 'alumni' ? 'Alumni mentor' : 'Professional mentor'}
          </div>
          <h3>
            <Link href={`/student/mentorship/${mentor._id}`}>
              {mentor.userId?.name || 'Unknown'}
            </Link>
            {mentor.mentorType === 'alumni' && (
              <BadgeCheck size={17} aria-label="Verified alumni" />
            )}
          </h3>
          <p>
            {mentor.currentRole}
            {mentor.currentCompany && (
              <>
                {' '}
                at <strong>{mentor.currentCompany}</strong>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mentor-card-facts">
        <span>
          <Briefcase size={15} />
          {mentor.yearsOfExperience} years of experience
        </span>
        <span>
          <Building size={15} />
          {mentor.industry}
        </span>
      </div>
      <div className="mentor-card-skills" aria-label="Expertise">
        {mentor.expertise.slice(0, 4).map((skill, i) => (
          <span key={i}>{skill}</span>
        ))}
        {mentor.expertise.length > 4 && <span>+{mentor.expertise.length - 4} more</span>}
      </div>
      <div className="mentor-card-reputation">
        <span>
          <Star size={15} fill={mentor.averageRating > 0 ? '#c28a28' : 'none'} color="#a67421" />
          <strong>
            {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New mentor'}
          </strong>
          <span>{mentor.totalSessions} sessions</span>
        </span>
        {!!mentor.badges?.length && (
          <div className="mentor-card-badges">
            {mentor.badges.map((badge, idx) => (
              <span key={idx} title={badge.badgeName}>
                {badge.badgeIcon.startsWith('http') ? (
                  <img src={badge.badgeIcon} alt={badge.badgeName} />
                ) : (
                  <BadgeCheck size={17} aria-label={badge.badgeName} />
                )}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mentor-card-actions">
        <Link href={`/student/mentorship/${mentor._id}`}>
          View profile
          <ArrowUpRight size={15} />
        </Link>
        <button
          type="button"
          onClick={() => onRequestSession(mentor._id)}
          disabled={!mentor.isAvailable}
        >
          {mentor.isAvailable ? 'Request session' : 'Unavailable'}
        </button>
      </div>
    </article>
  );
}
