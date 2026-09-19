import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Palette, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const PERKS = [
  'Free to explore all art mediums',
  'AI-powered medium recommendations',
  'Find studios and classes near you',
  'Access beginner workshops for free',
];

const STRENGTH_CONFIG = {
  weak:   { color: 'bg-red-400',    label: 'Weak',   width: 'w-1/3' },
  good:   { color: 'bg-canvas-400', label: 'Good',   width: 'w-2/3' },
  strong: { color: 'bg-sage-500',   label: 'Strong', width: 'w-full' },
};

const Signup = () => {
  const [form,         setForm]         = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const { signup }  = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success(`Welcome to ArtCrew, ${form.name}! Your account is ready.`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthKey = form.password.length >= 12 ? 'strong' : form.password.length >= 8 ? 'good' : form.password.length > 0 ? 'weak' : null;
  const strength    = strengthKey ? STRENGTH_CONFIG[strengthKey] : null;

  return (
    <div className="min-h-screen flex bg-cream">

      {/* ── Left art panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/80 via-charcoal-950/50 to-transparent" />
        <div className="absolute bottom-14 left-12 right-12">
          <p className="font-display font-bold text-3xl text-white mb-3 leading-snug">
            Start Your Art Journey Today
          </p>
          <ul className="space-y-2.5 mt-5">
            {PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-2.5 text-canvas-200 text-sm">
                <CheckCircle className="w-4 h-4 text-canvas-400 shrink-0" aria-hidden="true" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">

          {/* Back */}
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

          <h1 className="font-display font-bold text-3xl text-charcoal-900 mb-1.5">Create your account</h1>
          <p className="text-charcoal-500 mb-8">Free to join — discover your art medium today</p>

          {/* Error */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="signup-name" className="label">Full name</label>
              <input
                id="signup-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="Priya Sharma"
                required
                autoComplete="name"
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="label">Email address</label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pr-12"
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                  aria-required="true"
                  aria-describedby={strength ? 'password-strength' : undefined}
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
              {/* Password strength */}
              {strength && (
                <div id="password-strength" className="mt-2.5" aria-live="polite">
                  <div className="h-1 bg-charcoal-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                      role="progressbar"
                      aria-valuenow={strengthKey === 'strong' ? 100 : strengthKey === 'good' ? 66 : 33}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">{strength.label} password</p>
                </div>
              )}
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
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-charcoal-400 mt-4 leading-relaxed">
            By creating an account you agree to our{' '}
            <a href="#" className="text-canvas-500 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-canvas-500 hover:underline">Privacy Policy</a>.
          </p>

          <p className="text-center text-sm text-charcoal-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-canvas-600 font-semibold hover:text-canvas-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
