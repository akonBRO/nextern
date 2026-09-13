'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, BriefcaseBusiness, Search } from 'lucide-react';

export default function OpportunitySearch() {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('internship');
  function submit(event: FormEvent) {
    event.preventDefault();
    const filters = new URLSearchParams();
    if (search.trim()) filters.set('search', search.trim());
    if (type) filters.set('type', type);
    const destination = `/student/jobs${filters.size ? `?${filters.toString()}` : ''}`;
    router.push(
      session?.user ? destination : `/login?callbackUrl=${encodeURIComponent(destination)}`
    );
  }
  return (
    <div className="public-search-wrap">
      <form className="public-search" onSubmit={submit} aria-label="Find career opportunities">
        <label className="public-search-field">
          <Search size={21} aria-hidden="true" />
          <span>
            <span className="public-search-label">What do you want to do?</span>
            <input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Role, company, or keyword"
            />
          </span>
        </label>
        <label className="public-search-field public-search-type">
          <BriefcaseBusiness size={21} aria-hidden="true" />
          <span>
            <span className="public-search-label">Opportunity type</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All opportunities</option>
              <option value="internship">Internships</option>
              <option value="part-time">Part-time jobs</option>
              <option value="full-time">Full-time jobs</option>
              <option value="campus-drive">Campus recruitment</option>
              <option value="workshop">Workshops</option>
              <option value="webinar">Webinars</option>
            </select>
          </span>
        </label>
        <button type="submit" className="public-button">
          Find opportunities <ArrowRight size={18} />
        </button>
      </form>
      <p className="public-search-note">
        Sign in to see available opportunities and apply. Your search will be ready when you arrive.
      </p>
      <div className="public-search-suggestions">
        <span>Explore a field</span>
        {['Software engineering', 'Marketing', 'Design', 'Finance'].map((term) => (
          <button key={term} type="button" onClick={() => setSearch(term)}>
            {term}
            <ArrowRight size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}
