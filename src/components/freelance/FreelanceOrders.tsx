'use client';
import { useState, type ReactNode } from 'react';
import { ArrowRight, FolderOpen, Search } from 'lucide-react';
import type { OrderSummary } from './freelance-types';

export default function FreelanceOrders({
  orders,
  mode,
  renderOrder,
  onExplore,
}: {
  orders: OrderSummary[];
  mode: 'client' | 'freelancer';
  renderOrder: (order: OrderSummary) => ReactNode;
  onExplore: () => void;
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const needsReply = (o: OrderSummary) =>
    ['requested', 'countered'].includes(o.proposalStatus) && o.latestOfferBy !== mode;
  const matches = (o: OrderSummary, key: string) =>
    key === 'all' ||
    (key === 'reply' && needsReply(o)) ||
    (key === 'active' && ['in_progress', 'delivered', 'revision_requested'].includes(o.status)) ||
    (key === 'completed' && o.status === 'completed');
  const visible = orders.filter(
    (order) =>
      matches(order, filter) &&
      `${order.listing.title} ${order.freelancer.name} ${order.client.companyName || order.client.name}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  return (
    <div className="market-projects">
      <div className="market-project-toolbar">
        <div className="market-segments" aria-label="Filter projects">
          {[
            ['all', 'All projects'],
            ['reply', 'Needs your reply'],
            ['active', 'In progress'],
            ['completed', 'Completed'],
          ].map(([key, label]) => (
            <button key={key} aria-pressed={key === filter} onClick={() => setFilter(key)}>
              {label}
              <span>{orders.filter((o) => matches(o, key)).length}</span>
            </button>
          ))}
        </div>
        <label className="market-project-search">
          <Search size={17} />
          <input
            aria-label="Search projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or people"
          />
        </label>
      </div>
      {visible.length ? (
        <div className="market-project-list">{visible.map(renderOrder)}</div>
      ) : (
        <div className="market-empty">
          <FolderOpen size={32} />
          <h3>
            {orders.length
              ? 'No projects in this view.'
              : mode === 'client'
                ? 'Your next project starts with a conversation.'
                : 'Your next chapter of independent work.'}
          </h3>
          <p>
            {orders.length
              ? 'Try another status or search term.'
              : mode === 'client'
                ? 'Discover a service and send your first quote request. Your agreements, deliveries, and payments will live here.'
                : 'Publish a service to help clients discover your skills. Incoming requests and active work will appear here.'}
          </p>
          <button
            className="market-button"
            onClick={
              orders.length
                ? () => {
                    setFilter('all');
                    setSearch('');
                  }
                : onExplore
            }
          >
            {orders.length
              ? 'Show all projects'
              : mode === 'client'
                ? 'Explore services'
                : 'Manage your services'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function OrderProgress({ order }: { order: OrderSummary }) {
  if (['cancelled', 'disputed'].includes(order.status))
    return (
      <p className="market-order-notice">
        {order.status === 'disputed'
          ? 'This order is under review. Check the order actions and updates below.'
          : 'This order has been cancelled. Its details remain available for your records.'}
      </p>
    );
  const current =
    order.status === 'completed'
      ? 4
      : order.status === 'delivered'
        ? 3
        : order.proposalStatus !== 'accepted'
          ? 0
          : order.escrowStatus === 'pending_payment'
            ? 1
            : 2;
  return (
    <ol className="market-order-progress" aria-label="Order progress">
      {['Agree on quote', 'Fund escrow', 'Work in progress', 'Review delivery', 'Completed'].map(
        (label, index) => (
          <li
            key={label}
            className={index < current ? 'is-complete' : index === current ? 'is-current' : ''}
            aria-current={index === current ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        )
      )}
    </ol>
  );
}
