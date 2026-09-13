'use client';
import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BanknoteArrowUp,
  FileText,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import BrandLoader from '@/components/ui/BrandLoader';
import type { FreelanceFinancePayload, FreelanceInvoice, WorkspaceRole } from './freelance-types';
import { formatMarketMoney } from './marketplace-utils';
import { FREELANCE_PLATFORM_FEE_RATE } from '@/lib/freelance-shared';

type Props = {
  data: FreelanceFinancePayload | null;
  role: WorkspaceRole;
  escrowHeld: number;
  amount: string;
  setAmount: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  submitting: boolean;
  onWithdraw: () => void;
  onInvoice: (invoice: FreelanceInvoice) => void;
  onRefresh: () => void;
};
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not issued yet';
export default function FreelanceFinance(p: Props) {
  const [tab, setTab] = useState('invoices'),
    [perspective, setPerspective] = useState('all'),
    [search, setSearch] = useState('');
  if (!p.data)
    return (
      <div className="market-empty">
        <Wallet size={30} />
        <h3>Your financial summary is unavailable.</h3>
        <p>Please try again to load your balance and records.</p>
        <button className="market-button" onClick={p.onRefresh}>
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  const { summary, withdrawals } = p.data;
  const seller = p.role === 'student';
  const invoices = [...p.data.clientInvoices, ...p.data.freelancerInvoices]
    .sort((a, b) => new Date(b.issuedAt ?? 0).getTime() - new Date(a.issuedAt ?? 0).getTime())
    .filter(
      (invoice) =>
        (perspective === 'all' || perspective === invoice.perspective) &&
        `${invoice.invoiceNumber} ${invoice.listingTitle} ${invoice.counterpartyName}`
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  return (
    <div className="market-finance">
      <div className="market-finance-overview">
        <section className="market-balance">
          <div>
            <Wallet size={24} />
            <span>{seller ? 'AVAILABLE TO WITHDRAW' : 'TOTAL PROJECT SPENDING'}</span>
          </div>
          <strong>
            {formatMarketMoney(seller ? summary.accountBalanceBDT : summary.totalSpendingsBDT)}
          </strong>
          <p>
            {seller
              ? 'Released earnings, ready for your next move.'
              : 'Your funded freelance work, in one place.'}
          </p>
          {seller ? (
            <a href="#market-withdrawal">
              Manage withdrawals
              <ArrowUpRight size={17} />
            </a>
          ) : (
            <small>Currently held in escrow: {formatMarketMoney(p.escrowHeld)}</small>
          )}
        </section>
        <div className="market-finance-totals">
          {(seller
            ? [
                {
                  label: 'Total earnings',
                  value: summary.totalEarningsBDT,
                  icon: ArrowDownLeft,
                  note: 'After platform fees',
                },
                {
                  label: 'Withdrawn',
                  value: summary.totalWithdrawnBDT,
                  icon: ArrowUpRight,
                  note: 'Funds requested from your balance',
                },
                {
                  label: 'Pending withdrawal',
                  value: summary.pendingWithdrawalsBDT,
                  icon: BanknoteArrowUp,
                  note: 'Awaiting review',
                },
                {
                  label: 'Platform fees',
                  value: summary.totalPlatformFeesBDT,
                  icon: FileText,
                  note: `${Math.round(FREELANCE_PLATFORM_FEE_RATE * 100)}% of released project earnings`,
                },
              ]
            : [
                {
                  label: 'In escrow',
                  value: p.escrowHeld,
                  icon: Wallet,
                  note: 'Held until release or refund',
                },
                {
                  label: 'Total spending',
                  value: summary.totalSpendingsBDT,
                  icon: ArrowUpRight,
                  note: 'Funded project payments',
                },
              ]
          ).map(({ label, value, icon: Icon, note }) => (
            <div key={label}>
              <Icon size={18} />
              <span>{label}</span>
              <strong>{formatMarketMoney(value)}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>
      </div>
      <div className={`market-finance-records ${seller ? 'has-withdrawals' : ''}`}>
        <section className="market-section">
          <header>
            <div>
              <h2>Your transaction records</h2>
              <p>Open an invoice for the price breakdown and payment status.</p>
            </div>
            <button
              className="market-button-secondary"
              onClick={p.onRefresh}
              aria-label="Refresh financial records"
            >
              <RefreshCw size={16} />
            </button>
          </header>
          <div className="market-finance-tools">
            <div className="market-segments">
              {[
                ['invoices', 'Invoices'],
                ...(seller ? [['withdrawals', 'Withdrawal history']] : []),
              ].map(([key, label]) => (
                <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {tab === 'invoices' ? (
            <>
              <div className="market-invoice-search">
                <label>
                  <Search size={16} />
                  <input
                    aria-label="Search invoices"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoice or project"
                  />
                </label>
                {seller && (
                  <select
                    aria-label="Invoice perspective"
                    value={perspective}
                    onChange={(e) => setPerspective(e.target.value)}
                  >
                    <option value="all">All invoices</option>
                    <option value="freelancer">My earnings</option>
                    <option value="client">My purchases</option>
                  </select>
                )}
              </div>
              {invoices.length ? (
                <div className="market-invoice-list">
                  {invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      className="market-invoice-row"
                      onClick={() => p.onInvoice(invoice)}
                    >
                      <FileText size={23} />
                      <span>
                        <strong>{invoice.listingTitle}</strong>
                        <small>
                          {invoice.invoiceNumber} · {date(invoice.issuedAt)}
                        </small>
                        <small>{invoice.counterpartyName}</small>
                      </span>
                      <span>
                        <strong>{formatMarketMoney(invoice.grossAmountBDT)}</strong>
                        <small>{invoice.status.replaceAll('_', ' ')}</small>
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="market-empty">
                  <FileText size={29} />
                  <h3>{search ? 'No matching invoices.' : 'Every project tells a story.'}</h3>
                  <p>
                    {search
                      ? 'Try a project name, invoice number, or another perspective.'
                      : 'Your invoices will appear here as you request, fund, and complete freelance projects.'}
                  </p>
                </div>
              )}
            </>
          ) : withdrawals.length ? (
            <div className="market-withdrawal-list">
              {withdrawals.map((item) => (
                <article key={item._id}>
                  <div>
                    <strong>{formatMarketMoney(item.amountBDT)}</strong>
                    <small>Requested {date(item.createdAt)}</small>
                    {item.adminNote && <p>{item.adminNote}</p>}
                  </div>
                  <span data-status={item.status}>{item.status}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="market-empty">
              <BanknoteArrowUp size={29} />
              <h3>No withdrawals yet.</h3>
              <p>Your withdrawal requests and review status will appear here.</p>
            </div>
          )}
        </section>
        {seller && (
          <aside className="market-withdrawal-panel" id="market-withdrawal">
            <BanknoteArrowUp size={26} />
            <h2>Ready to withdraw?</h2>
            <p>
              Request funds from your available balance. Nextern reviews and processes each request.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                p.onWithdraw();
              }}
            >
              <label className="market-field">
                Amount (BDT)
                <input
                  aria-label="Withdrawal amount in BDT"
                  type="number"
                  min="1"
                  step="1"
                  max={summary.accountBalanceBDT}
                  required
                  value={p.amount}
                  onChange={(e) => p.setAmount(e.target.value)}
                  placeholder="Enter an amount"
                />
              </label>
              <label className="market-field">
                Note <small>Optional</small>
                <textarea
                  aria-label="Withdrawal note"
                  value={p.note}
                  onChange={(e) => p.setNote(e.target.value)}
                  rows={3}
                  placeholder="A note for the review team"
                />
              </label>
              <p className="market-withdrawal-available">
                Available: <strong>{formatMarketMoney(summary.accountBalanceBDT)}</strong>
              </p>
              <button
                className="market-button"
                type="submit"
                disabled={p.submitting || summary.accountBalanceBDT <= 0}
              >
                {p.submitting ? (
                  <BrandLoader variant="inline" label="Submitting" />
                ) : (
                  <>
                    Request withdrawal
                    <ArrowUpRight size={16} />
                  </>
                )}
              </button>
              {summary.accountBalanceBDT <= 0 && (
                <small>Complete a funded project to start building your available balance.</small>
              )}
            </form>
            <p className="market-withdrawal-note">
              Requested funds leave your available balance while awaiting review. Your lifetime
              earnings remain unchanged.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
