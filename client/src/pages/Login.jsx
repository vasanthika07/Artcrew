import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Palette,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import api from '../api/axios';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotForm, setForgotForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      const code = err.response?.data?.code;
      setError({ message: msg, devices: code === 'DEVICE_LIMIT_REACHED' ? err.response?.data?.devices : null });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = (e) => {
    e?.preventDefault();
    setForgotForm({
      email: form.email || '',
      newPassword: '',
      confirmPassword: '',
    });
    setForgotError(null);
    setShowForgotModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotForm.email.trim()) {
      setForgotError('Please enter your account email address.');
      return;
    }

    if (forgotForm.newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }

    setForgotLoading(true);
    try {
      let res;
      try {
        res = await api.post('/auth/forgot-password', {
          email: forgotForm.email.trim(),
          newPassword: forgotForm.newPassword,
          confirmPassword: forgotForm.confirmPassword,
        });
      } catch (err1) {
        if (err1.response?.status === 404) {
          res = await api.post('/auth/reset-password', {
            email: forgotForm.email.trim(),
            newPassword: forgotForm.newPassword,
            confirmPassword: forgotForm.confirmPassword,
          });
        } else {
          throw err1;
        }
      }

      toast.success(res.data?.message || 'Password successfully updated! You can now log in.');

      // Pre-fill the login form with the updated credentials
      setForm({
        email: forgotForm.email.trim(),
        password: forgotForm.newPassword,
      });

      setShowForgotModal(false);
      setForgotForm({ email: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setForgotLoading(false);
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
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs text-canvas-600 hover:text-canvas-700 transition-colors font-semibold cursor-pointer underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-1 cursor-pointer"
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
              className="btn-primary w-full justify-center py-3 text-base cursor-pointer shadow-sm"
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

      {/* ── Forgot / Reset Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-charcoal-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl shadow-dark w-full max-w-md animate-fade-up overflow-hidden border border-charcoal-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100 bg-charcoal-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-canvas-500/10 text-canvas-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-charcoal-900 leading-tight">
                    Reset Password
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Set a new secure password for your account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-lg hover:bg-charcoal-200 text-charcoal-400 hover:text-charcoal-700 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {forgotError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="font-medium">{forgotError}</p>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {/* Email input */}
                <div>
                  <label className="label">Registered Email</label>
                  <input
                    type="email"
                    value={forgotForm.email}
                    onChange={(e) =>
                      setForgotForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    required
                    className="input w-full"
                    autoComplete="email"
                  />
                </div>

                {/* New password input */}
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={forgotForm.newPassword}
                      onChange={(e) =>
                        setForgotForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className="input pr-12 w-full"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-1 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password input */}
                <div>
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={forgotForm.confirmPassword}
                      onChange={(e) =>
                        setForgotForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Repeat your new password"
                      required
                      minLength={8}
                      className="input pr-12 w-full"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password requirement hint */}
                <div className="p-3 bg-charcoal-50 rounded-xl border border-charcoal-100 text-[11px] text-charcoal-500 space-y-1">
                  <p className="font-semibold text-charcoal-700 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-canvas-500" /> Security Requirements:
                  </p>
                  <p className={forgotForm.newPassword.length >= 8 ? 'text-emerald-600 font-medium' : ''}>
                    • Minimum 8 characters in length
                  </p>
                  <p
                    className={
                      forgotForm.newPassword &&
                      forgotForm.newPassword === forgotForm.confirmPassword
                        ? 'text-emerald-600 font-medium'
                        : ''
                    }
                  >
                    • Both passwords must match
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-primary btn-sm shadow-sm"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1.5" />
                        Updating...
                      </>
                    ) : (
                      'Save & Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

