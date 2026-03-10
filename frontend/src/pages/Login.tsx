import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { Eye, EyeOff, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="animate-slide-up">
            <h1 className="text-3xl font-bold text-gradient-primary">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your supply-chain intelligence platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Create account
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Admin: <code className="bg-white px-1.5 py-0.5 rounded">admin@platform.com</code> / <code className="bg-white px-1.5 py-0.5 rounded">admin123</code></p>
              <p>Company: <code className="bg-white px-1.5 py-0.5 rounded">demo@company.com</code> / <code className="bg-white px-1.5 py-0.5 rounded">demo123</code></p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10 text-white">
          <div className="animate-slide-up">
            <Sparkles className="h-12 w-12 mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Semiconductor & Electronics
              <br />
              Supply-Chain Intelligence
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Connect with suppliers, buyers, and partners across the semiconductor ecosystem
            </p>
          </div>

          <div className="space-y-4 mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Matching</h3>
                <p className="text-sm text-blue-100">Find exact matches for your requirements instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Verified Companies</h3>
                <p className="text-sm text-blue-100">Access detailed profiles with contact information</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Data</h3>
                <p className="text-sm text-blue-100">Export and save searches for your team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
