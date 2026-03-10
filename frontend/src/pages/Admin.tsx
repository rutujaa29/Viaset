import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Building2,
  Database,
  Tag,
  Layers,
  BarChart3,
  ChevronRight,
  Users,
  TrendingUp,
  Activity,
  LayoutDashboard,
} from 'lucide-react';
import clsx from 'clsx';

const adminTabs = [
  { path: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
  { path: '/admin/companies', label: 'Companies', icon: Building2 },
  { path: '/admin/profiles', label: 'Company Profiles', icon: Database },
  { path: '/admin/lead-types', label: 'Lead Types', icon: Tag },
  { path: '/admin/industries', label: 'Industries', icon: Layers },
  { path: '/admin/usage', label: 'Usage Analytics', icon: BarChart3 },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Platform management and analytics</p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {adminTabs.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
}

interface DashboardOverview {
  totalCompanies: number;
  activeCompanies: number;
  planDistribution: Record<string, number>;
  totalSearches: number;
  totalUsers: number;
  recentCompanies: Array<{
    id: string;
    name: string;
    subscriptionPlan: string;
    createdAt: string;
    _count: { users: number };
  }>;
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<DashboardOverview>('/admin/dashboard/overview'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const planColors = {
    BASIC: 'bg-gray-100 text-gray-800',
    PRO: 'bg-blue-100 text-blue-800',
    ENTERPRISE: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Companies</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{data?.totalCompanies || 0}</p>
            </div>
            <div className="rounded-full bg-primary-100 p-3">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active (30d)</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{data?.activeCompanies || 0}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Searches</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{data?.totalSearches || 0}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{data?.totalUsers || 0}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(data?.planDistribution || {}).map(([plan, count]) => (
            <div key={plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{plan}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${planColors[plan as keyof typeof planColors]}`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Companies */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
          <NavLink to="/admin/companies" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </NavLink>
        </div>
        <div className="space-y-3">
          {data?.recentCompanies?.map((company) => (
            <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{company.name}</p>
                <p className="text-sm text-gray-500">
                  {company._count.users} user{company._count.users !== 1 ? 's' : ''} • {' '}
                  {new Date(company.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planColors[company.subscriptionPlan as keyof typeof planColors]}`}>
                {company.subscriptionPlan}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Company {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  searchesUsedThisMonth: number;
  searchLimitMonth: number | null;
  createdAt: string;
  lastActive: string;
  userCount: number;
  users: Array<{ email: string; name: string | null }>;
}

function AdminCompanies() {
  const { data: list, isLoading } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get<Company[]>('/admin/companies'),
  });
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/admin/companies/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
        <p className="text-sm text-gray-500">Companies will appear here when they register</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="table-header">
          <tr>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Users</th>
            <th className="px-4 py-3">Searches</th>
            <th className="px-4 py-3">Last Active</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {list.map((c) => (
            <tr key={c.id} className="table-row-hover">
              <td className="table-cell font-medium">{c.name}</td>
              <td className="table-cell">
                <select
                  value={c.subscriptionPlan}
                  onChange={(e) => updateMutation.mutate({ id: c.id, data: { subscriptionPlan: e.target.value } })}
                  className="input py-1 text-sm"
                >
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </td>
              <td className="table-cell">
                <span className={`badge ${c.subscriptionStatus === 'ACTIVE' ? 'badge-success' : 'badge-gray'}`}>
                  {c.subscriptionStatus}
                </span>
              </td>
              <td className="table-cell">{c.userCount}</td>
              <td className="table-cell">
                {c.searchesUsedThisMonth} / {c.searchLimitMonth || '∞'}
              </td>
              <td className="table-cell text-sm text-gray-500">
                {new Date(c.lastActive).toLocaleDateString()}
              </td>
              <td className="table-cell">
                <button
                  type="button"
                  onClick={() => updateMutation.mutate({ id: c.id, data: { subscriptionStatus: c.subscriptionStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE' } })}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {c.subscriptionStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminProfiles() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'company-profiles', page],
    queryFn: () => api.get<{ data: unknown[]; pagination: { page: number; totalPages: number; total: number } }>(`/admin/company-profiles?page=${page}&limit=20`),
  });
  const list = data?.data ?? [];
  const pagination = data?.pagination;

  if (isLoading) return <div className="text-gray-500">Loading…</div>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {pagination?.total ?? 0} company profiles in the master database
      </p>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Sub-category</th>
              <th className="px-4 py-3">Country</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(list as { companyName: string; category: string; subCategory: string | null; country: string | null }[]).map((p: { id: string; companyName: string; category: string; subCategory: string | null; country: string | null }) => (
              <tr key={(p as { id: string }).id}>
                <td className="table-cell font-medium">{p.companyName}</td>
                <td className="table-cell">{p.category}</td>
                <td className="table-cell">{p.subCategory ?? '—'}</td>
                <td className="table-cell">{p.country ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (pagination.totalPages ?? 1)}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function AdminLeadTypes() {
  const { data: list, isLoading } = useQuery({
    queryKey: ['admin', 'lead-types'],
    queryFn: () => api.get<{ id: string; name: string; category: string; slug: string }[]>('/admin/lead-types'),
  });
  if (isLoading) return <div className="text-gray-500">Loading…</div>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{list?.length || 0} lead types configured</p>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {list?.map((lt) => (
              <tr key={lt.id}>
                <td className="table-cell font-medium">{lt.name}</td>
                <td className="table-cell">{lt.category}</td>
                <td className="table-cell text-gray-500">{lt.slug}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminIndustries() {
  const { data: list, isLoading } = useQuery({
    queryKey: ['admin', 'industry-segments'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/admin/industry-segments'),
  });
  if (isLoading) return <div className="text-gray-500">Loading…</div>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{list?.length || 0} industry segments configured</p>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3">Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {list?.map((i) => (
              <tr key={i.id}>
                <td className="table-cell font-medium">{i.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminUsage() {
  const { data: list, isLoading } = useQuery({
    queryKey: ['admin', 'usage'],
    queryFn: () => api.get<{ companyId: string; company: { name: string; subscriptionPlan: string }; year: number; month: number; count: number }[]>('/admin/usage'),
  });
  if (isLoading) return <div className="text-gray-500">Loading…</div>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Platform usage by company and month</p>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Searches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {list?.map((u) => (
              <tr key={`${u.companyId}-${u.year}-${u.month}`}>
                <td className="table-cell font-medium">{u.company?.name ?? u.companyId}</td>
                <td className="table-cell">{u.company?.subscriptionPlan ?? '—'}</td>
                <td className="table-cell">{u.year}-{String(u.month).padStart(2, '0')}</td>
                <td className="table-cell">{u.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list?.length && <div className="p-8 text-center text-gray-500">No usage data yet.</div>}
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="profiles" element={<AdminProfiles />} />
        <Route path="lead-types" element={<AdminLeadTypes />} />
        <Route path="industries" element={<AdminIndustries />} />
        <Route path="usage" element={<AdminUsage />} />
      </Routes>
    </AdminLayout>
  );
}
