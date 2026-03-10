import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Bookmark, Trash2, ExternalLink, Grid, List, MapPin, Building2 } from 'lucide-react';
import clsx from 'clsx';

interface CompanyProfile {
    id: string;
    companyName: string;
    category: string;
    subCategory: string | null;
    city: string | null;
    country: string | null;
    companySize?: string | null;
    asSupplier: { leadType: { name: string } }[];
}

interface BookmarkItem {
    id: string;
    companyProfile: CompanyProfile;
    createdAt: string;
}

export default function Bookmarks() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const queryClient = useQueryClient();

    const { data: bookmarks, isLoading } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: () => api.get<BookmarkItem[]>('/bookmarks'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/bookmarks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });

    async function handleDelete(id: string) {
        if (confirm('Remove this bookmark?')) {
            await deleteMutation.mutateAsync(id);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {bookmarks?.length || 0} saved companies
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            'p-2 rounded border',
                            viewMode === 'grid'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        )}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            'p-2 rounded border',
                            viewMode === 'list'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        )}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {!bookmarks || bookmarks.length === 0 ? (
                <div className="card p-12 text-center">
                    <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Start bookmarking companies from search results to save them here
                    </p>
                    <Link to="/search" className="btn-primary inline-flex items-center gap-2">
                        Go to Search
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="card p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{bookmark.companyProfile.companyName}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {bookmark.companyProfile.subCategory}
                                    </p>
                                </div>
                                <span className={`badge ${bookmark.companyProfile.category === 'SUPPLIER' ? 'badge-primary' :
                                        bookmark.companyProfile.category === 'BUYER' ? 'badge-success' :
                                            'badge-gray'
                                    }`}>
                                    {bookmark.companyProfile.category}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span>{bookmark.companyProfile.city}, {bookmark.companyProfile.country}</span>
                                </div>
                                {bookmark.companyProfile.companySize && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-gray-400" />
                                        <span>{bookmark.companyProfile.companySize}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/company/${bookmark.companyProfile.id}`}
                                    className="flex-1 btn-primary text-center text-sm py-1.5"
                                >
                                    View Details
                                </Link>
                                <button
                                    onClick={() => handleDelete(bookmark.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                    title="Remove bookmark"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="table-header">
                            <tr>
                                <th className="px-4 py-3">Company</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Size</th>
                                <th className="px-4 py-3">Services</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {bookmarks.map((bookmark) => (
                                <tr key={bookmark.id} className="table-row-hover">
                                    <td className="table-cell font-medium">{bookmark.companyProfile.companyName}</td>
                                    <td className="table-cell">
                                        <span className={`badge ${bookmark.companyProfile.category === 'SUPPLIER' ? 'badge-primary' :
                                                bookmark.companyProfile.category === 'BUYER' ? 'badge-success' :
                                                    'badge-gray'
                                            }`}>
                                            {bookmark.companyProfile.category}
                                        </span>
                                    </td>
                                    <td className="table-cell">{bookmark.companyProfile.subCategory}</td>
                                    <td className="table-cell">{bookmark.companyProfile.city}, {bookmark.companyProfile.country}</td>
                                    <td className="table-cell">{bookmark.companyProfile.companySize ?? '—'}</td>
                                    <td className="table-cell text-xs max-w-xs truncate">
                                        {bookmark.companyProfile.asSupplier.map(s => s.leadType.name).join(', ')}
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/company/${bookmark.companyProfile.id}`}
                                                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(bookmark.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
