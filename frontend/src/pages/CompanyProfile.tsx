import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, Mail, Phone, Globe, MapPin, Award } from 'lucide-react';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.get<{
      id: string;
      companyName: string;
      category: string;
      subCategory: string | null;
      servicesOffered: string[];
      industriesServed: string[];
      email: string | null;
      phone: string | null;
      website: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      certifications: string | null;
      notes: string | null;
      companySize: string | null;
      industries: { industrySegment: { name: string } }[];
      asSupplier: { leadType: { name: string } }[];
      asBuyer: { leadType: { name: string } }[];
    }>(`/companies/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Company not found. <Link to="/company-database" className="underline">Back to database</Link>
      </div>
    );
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <Link to="/company-database" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Company Database
      </Link>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 bg-surface-50 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-100 px-3 py-0.5 text-sm font-medium text-primary-800">
              {profile.category}
            </span>
            {profile.subCategory && (
              <span className="rounded-full bg-gray-200 px-3 py-0.5 text-sm text-gray-700">
                {profile.subCategory}
              </span>
            )}
            {profile.companySize && (
              <span className="rounded-full bg-gray-200 px-3 py-0.5 text-sm text-gray-700">
                {profile.companySize}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Contact</h2>
            <ul className="space-y-2">
              {profile.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${profile.email}`} className="text-primary-600 hover:underline">
                    {profile.email}
                  </a>
                </li>
              )}
              {profile.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${profile.phone}`} className="text-gray-700">{profile.phone}</a>
                </li>
              )}
              {profile.website && (
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                </li>
              )}
              {location && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{location}</span>
                </li>
              )}
              {profile.certifications && (
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{profile.certifications}</span>
                </li>
              )}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Services & focus</h2>
            {profile.servicesOffered?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500">Services offered</p>
                <p className="mt-1 text-sm text-gray-900">{profile.servicesOffered.join(', ')}</p>
              </div>
            )}
            {profile.industriesServed?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500">Industries served</p>
                <p className="mt-1 text-sm text-gray-900">{profile.industriesServed.join(', ')}</p>
              </div>
            )}
            {profile.industries?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500">Industry segments</p>
                <p className="mt-1 text-sm text-gray-900">
                  {profile.industries.map((i) => i.industrySegment.name).join(', ')}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Lead mapping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Supplies (lead types)</p>
              <p className="mt-1 text-sm text-gray-900">
                {profile.asSupplier?.length
                  ? profile.asSupplier.map((s) => s.leadType.name).join(', ')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Needs (lead types)</p>
              <p className="mt-1 text-sm text-gray-900">
                {profile.asBuyer?.length
                  ? profile.asBuyer.map((b) => b.leadType.name).join(', ')
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {profile.notes && (
          <div className="border-t border-gray-200 px-6 py-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
