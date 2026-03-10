import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bookmark, Database, TrendingUp, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const company = user?.company;
  const used = company?.searchesUsedThisMonth ?? 0;
  const limit = company?.searchLimitMonth;
  const hasLimit = limit != null;
  const usagePercent = hasLimit ? Math.min((used / limit) * 100, 100) : 0;

  // Animated counter
  const [displayUsed, setDisplayUsed] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = used;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayUsed(end);
        clearInterval(timer);
      } else {
        setDisplayUsed(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [used]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your supply-chain intelligence platform
        </p>
      </div>

      {/* Stats Cards */}
      {company && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Company Card */}
          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Company</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{company.name}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Subscription Plan</p>
                <p className="mt-2 text-xl font-bold text-gradient-primary">{company.subscriptionPlan}</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Searches Card */}
          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Searches this month</p>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {displayUsed}
                  {hasLimit && <span className="text-gray-400"> / {limit}</span>}
                </p>
                {hasLimit && (
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-green-100 p-3 group-hover:bg-green-200 transition-colors">
                <Search className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Account Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <p className="text-xl font-bold text-green-600">
                    {company.subscriptionStatus ?? 'ACTIVE'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-100 p-3 group-hover:bg-emerald-200 transition-colors">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <Link
          to="/search"
          className="card-hover p-6 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Search Leads</h2>
              <p className="mt-1 text-sm text-gray-600">
                Find suppliers and buyers by lead type, industry, and location
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/saved-searches"
          className="card-hover p-6 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg group-hover:shadow-xl transition-shadow">
                <Bookmark className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Saved Searches</h2>
              <p className="mt-1 text-sm text-gray-600">
                Access and reuse your saved search filters and queries
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/company-database"
          className="card-hover p-6 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Company Database</h2>
              <p className="mt-1 text-sm text-gray-600">
                Browse all companies in the semiconductor ecosystem
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Getting Started Guide */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 p-3 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Quick Start Guide</h2>
            <p className="mt-1 text-sm text-gray-600">
              Get the most out of your supply-chain intelligence platform
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">1</span>
                <span className="text-gray-700">
                  <Link to="/search" className="link font-medium">Search by lead type</Link> to find suppliers or buyers for specific services (e.g., IC Packaging, PCB Design)
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">2</span>
                <span className="text-gray-700">
                  Use advanced filters to narrow results by industry, location, and company type
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">3</span>
                <span className="text-gray-700">
                  Save frequently used searches and export results to CSV or Excel
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">4</span>
                <span className="text-gray-700">
                  <Link to="/account" className="link font-medium">Upgrade your plan</Link> for unlimited searches and advanced features
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
