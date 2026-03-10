import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ToastContainer';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SearchLeads from './pages/SearchLeads';
import SavedSearches from './pages/SavedSearches';
import CompanyDatabase from './pages/CompanyDatabase';
import CompanyProfile from './pages/CompanyProfile';
import AccountSubscription from './pages/AccountSubscription';
import Admin from './pages/Admin';
import Bookmarks from './pages/Bookmarks';
import CompanyComparison from './pages/CompanyComparison';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="search" element={<SearchLeads />} />
        <Route path="saved-searches" element={<SavedSearches />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="comparison" element={<CompanyComparison />} />
        <Route path="company-database" element={<CompanyDatabase />} />
        <Route path="company/:id" element={<CompanyProfile />} />
        <Route path="account" element={<AccountSubscription />} />
      </Route>
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }
      >
        <Route path="*" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
