import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { GitCompare, Plus, Trash2, Check, X } from 'lucide-react';

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
    certifications?: string | null;
    asSupplier: { leadType: { name: string } }[];
    asBuyer: { leadType: { name: string } }[];
}

interface Comparison {
    id: string;
    name: string;
    companyProfileIds: string[];
    companies?: CompanyProfile[];
    createdAt: string;
}

export default function CompanyComparison() {
    const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: comparisons } = useQuery({
        queryKey: ['comparisons'],
        queryFn: () => api.get<Comparison[]>('/comparison'),
    });

    const { data: comparisonDetails } = useQuery({
        queryKey: ['comparison', selectedComparison],
        queryFn: () => api.get<Comparison>(`/comparison/${selectedComparison}`),
        enabled: !!selectedComparison,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/comparison/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comparisons'] });
            setSelectedComparison(null);
        },
    });

    async function handleDelete(id: string) {
        if (confirm('Delete this comparison?')) {
            await deleteMutation.mutateAsync(id);
        }
    }

    const companies = comparisonDetails?.companies || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Comparison</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Compare companies side-by-side to make informed decisions
                </p>
            </div>

            {/* Saved Comparisons */}
            <div className="card p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Saved Comparisons</h2>
                {!comparisons || comparisons.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">
                        No saved comparisons yet. Create one from search results.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {comparisons.map((comp) => (
                            <button
                                key={comp.id}
                                onClick={() => setSelectedComparison(comp.id)}
                                className={`px-4 py-2 rounded-lg border transition-colors ${selectedComparison === comp.id
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                                    }`}
                            >
                                {comp.name} ({comp.companyProfileIds.length})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Comparison Table */}
            {selectedComparison && companies.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {comparisonDetails?.name}
                        </h2>
                        <button
                            onClick={() => handleDelete(selectedComparison)}
                            className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                                        Attribute
                                    </th>
                                    {companies.map((company) => (
                                        <th key={company.id} className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            {company.companyName}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Type</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3">
                                            <span className={`badge ${company.category === 'SUPPLIER' ? 'badge-primary' :
                                                    company.category === 'BUYER' ? 'badge-success' :
                                                        'badge-gray'
                                                }`}>
                                                {company.category}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Sub-category</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            {company.subCategory || '—'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Location</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            {company.city}, {company.country}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Company Size</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            {company.companySize || '—'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Year Established</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            {company.yearEstablished || '—'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Export Capability</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3">
                                            {company.exportCapability ? (
                                                <Check className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <X className="h-5 w-5 text-gray-400" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Certifications</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            {company.certifications || '—'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Services Offered</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            <ul className="list-disc list-inside space-y-1">
                                                {company.asSupplier.map((s, i) => (
                                                    <li key={i}>{s.leadType.name}</li>
                                                ))}
                                            </ul>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Looking For</td>
                                    {companies.map((company) => (
                                        <td key={company.id} className="px-4 py-3 text-sm text-gray-900">
                                            {company.asBuyer.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1">
                                                    {company.asBuyer.map((b, i) => (
                                                        <li key={i}>{b.leadType.name}</li>
                                                    ))}
                                                </ul>
                                            ) : '—'}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!selectedComparison && (
                <div className="card p-12 text-center">
                    <GitCompare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison selected</h3>
                    <p className="text-sm text-gray-500">
                        Select a saved comparison above or create a new one from search results
                    </p>
                </div>
            )}
        </div>
    );
}
