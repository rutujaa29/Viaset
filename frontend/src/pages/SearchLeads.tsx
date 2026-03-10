import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search, Download, Bookmark, ExternalLink, ChevronRight,
  Star, Info, CheckSquare, Square, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

interface LeadType {
  id: string;
  name: string;
  category: string;
  slug: string;
}
interface IndustrySegment {
  id: string;
  name: string;
}
interface MatchScore {
  companyProfileId: string;
  score: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}
interface CompanyProfile {
  id: string;
  companyName: string;
  category: string;
  subCategory: string | null;
  city: string | null;
  country: string | null;
  companySize?: string | null;
  yearEstablished?: number | null;
  exportCapability?: boolean;
  dataCompleteness?: number;
  asSupplier: { leadType: { name: string } }[];
  asBuyer: { leadType: { name: string } }[];
}

const ITEMS_PER_PAGE = 20;

export default function SearchLeads() {
  const { user } = useAuth();

  // Multi-select state
  const [leadTypeIds, setLeadTypeIds] = useState<string[]>([]);
  const [industryIds, setIndustryIds] = useState<string[]>([]);

  // Single-select state
  const [companyType, setCompanyType] = useState('');
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [companySize, setCompanySize] = useState('');

  // UI state
  const [page, setPage] = useState(1);
  const [savedName, setSavedName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showRecommendations, setShowRecommendations] = useState(true);

  const { data: leadTypes } = useQuery({
    queryKey: ['lead-types'],
    queryFn: () => api.get<LeadType[]>('/search/lead-types'),
  });

  const { data: industries } = useQuery({
    queryKey: ['industry-segments'],
    queryFn: () => api.get<IndustrySegment[]>('/search/industry-segments'),
  });

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), limit: String(ITEMS_PER_PAGE) };
    if (leadTypeIds.length > 0) p.leadTypeIds = leadTypeIds.join(',');
    if (industryIds.length > 0) p.industryIds = industryIds.join(',');
    if (companyType) p.companyType = companyType;
    if (location) p.location = location;
    if (keyword) p.keyword = keyword;
    if (companySize) p.companySize = companySize;
    return p;
  }, [leadTypeIds, industryIds, companyType, location, keyword, companySize, page]);

  const { data: searchResult, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['search', params],
    queryFn: () => api.get<{
      data: CompanyProfile[];
      matches: MatchScore[];
      recommendations: CompanyProfile[];
      pagination: { total: number; totalPages: number; page: number }
    }>('/search/leads', params),
    enabled: true,
  });

  const canExport = user?.company?.subscriptionPlan === 'PRO' || user?.company?.subscriptionPlan === 'ENTERPRISE' || user?.role === 'ADMIN';
  const canSaveSearch = true;

  // Multi-select handlers
  function toggleLeadType(id: string) {
    setLeadTypeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setPage(1);
  }

  function toggleIndustry(id: string) {
    setIndustryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setPage(1);
  }

  function toggleCompanySelection(id: string) {
    setSelectedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllCompanies() {
    if (selectedCompanies.size === rows.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(rows.map(r => r.id)));
    }
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    const idsToExport = selectedCompanies.size > 0
      ? Array.from(selectedCompanies)
      : searchResult?.data?.map(c => c.id) || [];

    if (idsToExport.length === 0) return;

    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, ids: idsToExport }),
      });
      if (!res.ok) throw new Error(await res.json().then((e) => e.error));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `companies-export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setSelectedCompanies(new Set());
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleSaveSearch() {
    if (!savedName.trim()) {
      alert('Enter a name for this search');
      return;
    }
    try {
      await api.post('/saved-searches', {
        name: savedName,
        filters: { leadTypeIds, industryIds, companyType, location, keyword, companySize },
      });
      setSavedName('');
      alert('Search saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  function getConfidenceBadge(confidence: 'LOW' | 'MEDIUM' | 'HIGH') {
    const styles = {
      HIGH: 'bg-green-100 text-green-800 border-green-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${styles[confidence]}`}>
        <Star className="h-3 w-3" />
        {confidence}
      </span>
    );
  }

  const pagination = searchResult?.pagination;
  const rows = searchResult?.data ?? [];
  const matches = searchResult?.matches ?? [];
  const recommendations = searchResult?.recommendations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select lead types and filters to find suppliers and buyers with AI-powered matching.
        </p>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && showRecommendations && (
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-900">Top Recommendations</h2>
            </div>
            <button
              onClick={() => setShowRecommendations(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                to={`/company/${rec.id}`}
                className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <p className="font-medium text-sm text-gray-900 truncate">{rec.companyName}</p>
                <p className="text-xs text-gray-500 mt-1">{rec.city}, {rec.country}</p>
                <p className="text-xs text-primary-600 mt-1 font-medium">View details →</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Filters</h2>

        {/* Multi-select Lead Types */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Lead Types (Multi-select)
          </label>
          <div className="flex flex-wrap gap-2">
            {leadTypes?.slice(0, 12).map((lt) => (
              <button
                key={lt.id}
                type="button"
                onClick={() => toggleLeadType(lt.id)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                  leadTypeIds.includes(lt.id)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                )}
              >
                {lt.name}
              </button>
            ))}
            {leadTypes && leadTypes.length > 12 && (
              <span className="text-xs text-gray-500 self-center">+{leadTypes.length - 12} more</span>
            )}
          </div>
          {leadTypeIds.length > 0 && (
            <button
              onClick={() => setLeadTypeIds([])}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700"
            >
              Clear all ({leadTypeIds.length})
            </button>
          )}
        </div>

        {/* Multi-select Industries */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Industries (Multi-select)
          </label>
          <div className="flex flex-wrap gap-2">
            {industries?.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => toggleIndustry(ind.id)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                  industryIds.includes(ind.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                )}
              >
                {ind.name}
              </button>
            ))}
          </div>
          {industryIds.length > 0 && (
            <button
              onClick={() => setIndustryIds([])}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Clear all ({industryIds.length})
            </button>
          )}
        </div>

        {/* Other Filters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Company type</label>
            <select
              value={companyType}
              onChange={(e) => { setCompanyType(e.target.value); setPage(1); }}
              className="input mt-1"
            >
              <option value="">All</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="BUYER">Buyer</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Company size</label>
            <select
              value={companySize}
              onChange={(e) => { setCompanySize(e.target.value); setPage(1); }}
              className="input mt-1"
            >
              <option value="">All</option>
              <option value="Startup">Startup</option>
              <option value="MSME">MSME</option>
              <option value="Large">Large</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1); }}
              placeholder="City, state or country"
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="Company or service"
              className="input mt-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-primary flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </button>

          {canSaveSearch && (
            <>
              <input
                type="text"
                value={savedName}
                onChange={(e) => setSavedName(e.target.value)}
                placeholder="Save search as..."
                className="input max-w-[200px]"
              />
              <button type="button" onClick={handleSaveSearch} className="btn-secondary flex items-center gap-1">
                <Bookmark className="h-4 w-4" /> Save
              </button>
            </>
          )}

          {canExport && rows.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="btn-secondary flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                CSV {selectedCompanies.size > 0 && `(${selectedCompanies.size})`}
              </button>
              <button
                type="button"
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="btn-secondary flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Excel {selectedCompanies.size > 0 && `(${selectedCompanies.size})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 w-12">
                  <button onClick={toggleAllCompanies} className="text-gray-500 hover:text-gray-700">
                    {selectedCompanies.size === rows.length && rows.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Sub-category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Supplies</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2 py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                      Loading results...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center text-gray-500 py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-12 w-12 text-gray-300" />
                      <p className="font-medium">No results found</p>
                      <p className="text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const match = matches[idx];
                  return (
                    <tr key={row.id} className="table-row-hover">
                      <td className="table-cell">
                        <button
                          onClick={() => toggleCompanySelection(row.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {selectedCompanies.has(row.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1">
                          {getConfidenceBadge(match?.confidence || 'LOW')}
                          {match?.reasons && match.reasons.length > 0 && (
                            <div className="group relative">
                              <Info className="h-3 w-3 text-gray-400 cursor-help" />
                              <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -left-2 top-5">
                                <ul className="space-y-1">
                                  {match.reasons.map((reason, i) => (
                                    <li key={i}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell font-medium">{row.companyName}</td>
                      <td className="table-cell">
                        <span className={`badge ${row.category === 'SUPPLIER' ? 'badge-primary' :
                          row.category === 'BUYER' ? 'badge-success' :
                            'badge-gray'
                          }`}>
                          {row.category}
                        </span>
                      </td>
                      <td className="table-cell">{row.subCategory ?? '—'}</td>
                      <td className="table-cell">{row.city && row.country ? `${row.city}, ${row.country}` : row.country ?? '—'}</td>
                      <td className="table-cell text-xs">{row.companySize ?? '—'}</td>
                      <td className="table-cell text-xs max-w-xs truncate">
                        {row.asSupplier.length ? row.asSupplier.map((s) => s.leadType.name).join(', ') : '—'}
                      </td>
                      <td className="table-cell">
                        <Link
                          to={`/company/${row.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
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
