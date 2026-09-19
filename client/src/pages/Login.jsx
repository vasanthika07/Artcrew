import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Palette, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const Login = () => {
  const [form,         setForm]         = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg  = err.response?.data?.message || 'Login failed. Please check your credentials.';
      const code = err.response?.data?.code;
      setError({ message: msg, devices: code === 'DEVICE_LIMIT_REACHED' ? err.response?.data?.devices : null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream">

      {/* ── Left art panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=90"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/75 via-charcoal-950/40 to-transparent" />

        {/* Quote overlay */}
        <div className="absolute bottom-14 left-12 right-12">
          <p className="font-display font-bold text-3xl text-white mb-3 leading-snug">
            Create. Discover. Learn.
          </p>
          <p className="text-charcoal-300 text-base leading-relaxed">
            Join thousands of artists finding their perfect medium and creative community.
          </p>
          {/* Decorative dots */}
          <div className="flex gap-2 mt-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-canvas-400' : 'bg-charcoal-600'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">

          {/* Back to site */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-charcoal-700 transition-colors mb-8 group"
            aria-label="Back to ArtCrew home"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
            Back to site
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center shadow-art">
              <Palette className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-xl text-charcoal-900">ArtCrew</span>
          </div>

          <h1 className="font-display font-bold text-3xl text-charcoal-900 mb-1.5">Welcome back</h1>
          <p className="text-charcoal-500 mb-8">Sign in to continue your creative journey</p>

          {/* Error */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm text-red-700 font-medium">{error.message}</p>
                {error.devices && (
                  <div className="mt-2 space-y-1">
                    {error.devices.map((d, i) => (
                      <p key={i} className="text-xs text-red-500">
                        • {d.userAgent?.slice(0, 40)} — {new Date(d.lastActive).toLocaleDateString()}
                      </p>
                    ))}
                    <Link to="/account" className="text-xs text-red-600 underline font-medium">Manage devices</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="label">Email address</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="you@example.com"
                required
                autoComplete="email"
                aria-required="true"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="label mb-0">Password</label>
                <a href="#" className="text-xs text-canvas-500 hover:text-canvas-600 transition-colors font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-1"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                    : <Eye className="w-4 h-4" aria-hidden="true" />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-canvas-600 font-semibold hover:text-canvas-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
