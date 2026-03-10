import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Users, CreditCard, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountSubscription() {
  const { user } = useAuth();
  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () =>
      api.get<{
        name: string;
        subscriptionPlan: string;
        subscriptionStatus: string;
        searchesUsedThisMonth: number;
        searchLimitMonth: number | null;
        resetUsageOn: string | null;
      }>('/subscription/status'),
  });
  const { data: users } = useQuery({
    queryKey: ['subscription-users'],
    queryFn: () => api.get<{ id: string; email: string; name: string | null; role: string; createdAt: string }[]>('/subscription/users'),
    enabled: user?.role === 'COMPANY_ADMIN' || user?.role === 'ADMIN',
  });

  const company = user?.company ?? status;
  const used = company?.searchesUsedThisMonth ?? 0;
  const limit = company?.searchLimitMonth;
  const hasLimit = limit != null;
  const percent = hasLimit && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account & Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your company account and view usage.</p>
      </div>

      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <CreditCard className="h-5 w-5" /> Subscription
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Company</dt>
            <dd className="mt-1 font-medium text-gray-900">{status?.name ?? company?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Plan</dt>
            <dd className="mt-1 font-medium text-gray-900">{status?.subscriptionPlan ?? company?.subscriptionPlan ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 font-medium text-green-600">{status?.subscriptionStatus ?? company?.subscriptionStatus ?? 'ACTIVE'}</dd>
          </div>
          {status?.resetUsageOn && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Usage resets</dt>
              <dd className="mt-1 text-sm text-gray-700">
                {new Date(status.resetUsageOn).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>
        {hasLimit && (
          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Searches this month</span>
              <span className="text-gray-500">{used} / {limit}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
        {!hasLimit && (
          <p className="mt-4 text-sm text-gray-600">Unlimited searches on your current plan.</p>
        )}
        <p className="mt-4 text-sm text-gray-500">
          To upgrade or change plan, contact your account administrator or platform support.
        </p>
      </div>

      {(user?.role === 'COMPANY_ADMIN' || user?.role === 'ADMIN') && (
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5" /> Users
          </h2>
          {users?.length ? (
            <ul className="mt-4 divide-y divide-gray-200">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{u.email}</p>
                    <p className="text-sm text-gray-500">{u.name ?? '—'} · {u.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No other users in this company.</p>
          )}
        </div>
      )}

      {user?.role === 'ADMIN' && (
        <Link to="/admin" className="btn-primary inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Open Admin Panel
        </Link>
      )}
    </div>
  );
}
