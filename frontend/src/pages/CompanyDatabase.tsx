import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ChevronRight } from 'lucide-react';

interface CompanyProfile {
  id: string;
  companyName: string;
  category: string;
  subCategory: string | null;
  city: string | null;
  country: string | null;
}

const PAGE_SIZE = 20;

export default function CompanyDatabase() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const params: Record<string, string> = { keyword: keyword.trim() || undefined!, page: String(page), limit: String(PAGE_SIZE) };
  if (!params.keyword) delete params.keyword;

  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['search', 'company-db', { page, keyword: keyword.trim() }],
    queryFn: () =>
      api.get<{ data: CompanyProfile[]; pagination: { total: number; totalPages: number; page: number } }>(
        '/search/leads',
        { limit: String(PAGE_SIZE), page: String(page), ...(keyword.trim() ? { keyword: keyword.trim() } : {}) }
      ),
  });

  const rows = searchResult?.data ?? [];
  const pagination = searchResult?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Database</h1>
        <p className="mt-1 text-sm text-gray-500">Browse and search all companies in the platform.</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="Search by company name or keyword..."
            className="input max-w-md"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Sub-category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500">No companies found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{row.companyName}</td>
                    <td className="table-cell">{row.category}</td>
                    <td className="table-cell">{row.subCategory ?? '—'}</td>
                    <td className="table-cell">{row.city && row.country ? `${row.city}, ${row.country}` : row.country ?? '—'}</td>
                    <td className="table-cell">
                      <Link to={`/company/${row.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                        View <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
