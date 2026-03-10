import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Search, Trash2 } from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

export default function SavedSearches() {
  const queryClient = useQueryClient();
  const { data: list, isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => api.get<SavedSearch[]>('/saved-searches'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/saved-searches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
        <p className="mt-1 text-sm text-gray-500">Reuse your filters and run saved searches.</p>
      </div>

      <div className="card divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : !list?.length ? (
          <div className="p-8 text-center text-gray-500">No saved searches yet. Save a search from Search Leads.</div>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {Object.entries(item.filters)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ') || 'No filters'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/search?${new URLSearchParams(item.filters).toString()}`}
                  className="btn-primary flex items-center gap-2"
                >
                  <Search className="h-4 w-4" /> Run
                </Link>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="btn-ghost text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
