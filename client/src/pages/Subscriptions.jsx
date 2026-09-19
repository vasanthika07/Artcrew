import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X as XIcon, Shield, ChevronDown, Zap } from 'lucide-react';
import api from '../api/axios';
import SubscriptionCard from '../components/SubscriptionCard';
import CheckoutModal from '../components/CheckoutModal';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

const FAQ_ITEMS = [
  { q: 'Can I cancel anytime?', a: "Yes, cancel anytime from your account settings. You'll retain access until the end of your billing period — no questions asked." },
  { q: 'How does the device limit work?', a: 'Your account can be active on up to 2 devices simultaneously. Manage and revoke devices anytime from your account settings.' },
  { q: 'Are payments secure?', a: 'Payments are processed securely with bank-grade 256-bit encryption. We never store your card details.' },
  { q: 'Can I switch plans?', a: 'Yes, upgrade or downgrade your plan anytime. Changes take effect on your next billing cycle with prorated adjustments.' },
  { q: 'Is there a free trial?', a: "Our Free plan gives you permanent access to explore 3 art mediums and the recorded workshop previews — no credit card required." },
];

const FEATURE_ROWS = [
  { label: 'Art mediums',             free: '3 mediums', pro: 'All',   studio: 'All'  },
  { label: 'Recorded workshops',      free: 'Preview',   pro: '✓',     studio: '✓'    },
  { label: 'Full workshop library',   free: false,       pro: true,    studio: true   },
  { label: 'Live sessions',           free: false,       pro: true,    studio: true   },
  { label: 'AI art advisor',          free: true,        pro: true,    studio: true   },
  { label: 'Studio discounts',        free: false,       pro: false,   studio: true   },
  { label: '1-on-1 mentorship',       free: false,       pro: false,   studio: '1/mo' },
  { label: 'Devices',                 free: '1',         pro: '2',     studio: '3'    },
  { label: 'Priority support',        free: false,       pro: false,   studio: true   },
];

const FeatureCell = ({ val, highlight }) => {
  if (val === true)   return <Check className={`w-4 h-4 mx-auto ${highlight ? 'text-canvas-500' : 'text-sage-500'}`} aria-label="Included" />;
  if (val === false)  return <XIcon className="w-4 h-4 mx-auto text-charcoal-200" aria-label="Not included" />;
  return <span className={`text-sm font-medium ${highlight ? 'text-canvas-600' : 'text-charcoal-700'}`}>{val}</span>;
};

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-charcoal-100 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-canvas-50/50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium text-charcoal-800 pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-charcoal-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-spring ${open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!open}
      >
        <p className="px-5 pb-4 text-sm text-charcoal-500 leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const Subscriptions = () => {
  const [plans,         setPlans]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [checkoutPlan,  setCheckoutPlan]  = useState(null);
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/subscriptions')
      .then(r  => setPlans(r.data.data || []))
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/subscriptions' } });
      return;
    }

    if (plan.price === 0) {
      try {
        await api.post('/subscriptions/verify-payment', {
          planId: plan._id,
        });
        await refreshUser();
        toast.success(`Switched to ${plan.name} plan!`);
        navigate('/account');
      } catch (err) {
        toast.error('Failed to update plan');
      }
      return;
    }

    // Open rich checkout modal for paid plans
    setCheckoutPlan(plan);
  };

  const handleCheckoutSuccess = async (plan) => {
    await refreshUser();
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero ── */}
      <header className="bg-art-gradient relative overflow-hidden py-20 text-center">
        <div className="absolute inset-0 bg-hero-pattern opacity-25" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-canvas-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative container-art">
          <p className="eyebrow-light animate-fade-in">Plans & Pricing</p>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4 animate-fade-up">
            Simple, Honest Pricing
          </h1>
          <p className="text-charcoal-300 text-lg md:text-xl max-w-lg mx-auto mb-8 animate-fade-up delay-100">
            Start exploring for free. Upgrade to unlock live sessions, workshops, and studio access.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-charcoal-900/80 border border-charcoal-700 rounded-full p-1 gap-0.5 animate-fade-up delay-200" role="group" aria-label="Billing period">
            {['monthly', 'yearly'].map(p => (
              <button
                key={p}
                onClick={() => setBillingPeriod(p)}
                aria-pressed={billingPeriod === p}
                className={billingPeriod === p ? 'billing-toggle-btn billing-toggle-btn-active' : 'billing-toggle-btn billing-toggle-btn-inactive text-charcoal-300'}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
                {p === 'yearly' && (
                  <span className="ml-2 badge-success badge text-[10px]">Save 20%</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="container-art py-16">

        {/* ── Plan cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-charcoal-100 p-6 space-y-4">
                <div className="skeleton h-10 w-10 rounded-2xl" />
                <div className="skeleton h-6 w-1/2 rounded" />
                <div className="skeleton h-10 w-2/3 rounded" />
                {[...Array(5)].map((_, j) => <div key={j} className="skeleton h-4 w-full rounded" />)}
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
            {plans.map(plan => (
              <SubscriptionCard
                key={plan._id}
                plan={plan}
                onSelect={handleSelect}
                billingPeriod={billingPeriod}
              />
            ))}
          </div>
        )}

        {/* ── Feature comparison table ── */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-charcoal-900 text-center mb-2">
            Compare Plans
          </h2>
          <p className="text-charcoal-500 text-center mb-8">Everything you get with each plan</p>

          <div className="card overflow-hidden shadow-card">
            <table className="w-full text-sm" aria-label="Plan feature comparison">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-charcoal-500 bg-charcoal-50 text-xs uppercase tracking-wider">
                    Feature
                  </th>
                  {['Free', 'Pro', 'Studio'].map((tier, i) => (
                    <th
                      key={tier}
                      className={`px-5 py-4 text-center font-bold text-sm ${
                        i === 1
                          ? 'text-canvas-700 bg-canvas-50'
                          : 'text-charcoal-700 bg-charcoal-50'
                      }`}
                    >
                      {tier}
                      {i === 1 && <div className="text-[10px] font-normal text-canvas-500 mt-0.5">Most Popular</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map(({ label, free, pro, studio }, rowIdx) => (
                  <tr
                    key={label}
                    className={`border-t border-charcoal-100 ${rowIdx % 2 === 0 ? '' : 'bg-charcoal-50/30'} hover:bg-canvas-50/20 transition-colors`}
                  >
                    <td className="px-5 py-3.5 text-charcoal-700 font-medium">{label}</td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell val={free} /></td>
                    <td className="px-5 py-3.5 text-center bg-canvas-50/30"><FeatureCell val={pro} highlight /></td>
                    <td className="px-5 py-3.5 text-center"><FeatureCell val={studio} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-charcoal-900 text-center mb-2">
            Questions?
          </h2>
          <p className="text-charcoal-500 text-center mb-8">Everything you need to know about ArtCrew plans</p>
          <div className="space-y-3" role="list" aria-label="Frequently asked questions">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 text-charcoal-400 text-sm">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sage-500" aria-hidden="true" />
              Razorpay secured
            </div>
            <span aria-hidden="true">·</span>
            <span>Cancel anytime</span>
            <span aria-hidden="true">·</span>
            <span>India-based support</span>
            <span aria-hidden="true">·</span>
            <span>₹299/mo to get started</span>
          </div>
        </div>
      </div>

      {/* ── Seamless Checkout & Payment Modal ── */}
      <CheckoutModal
        plan={checkoutPlan}
        isOpen={Boolean(checkoutPlan)}
        onClose={() => setCheckoutPlan(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};

export default Subscriptions;
