import { Check, Zap, Star, Lock, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TIER_GRADIENT = {
  basic:  'from-charcoal-100 to-charcoal-50',
  pro:    'from-canvas-500 to-terracotta-500',
  studio: 'from-charcoal-800 to-charcoal-900',
};

const SubscriptionCard = ({ plan, onSelect, billingPeriod }) => {
  const { user, hasSubscription, subscriptionTier } = useAuth();
  const isCurrentPlan = subscriptionTier === plan.slug && hasSubscription;
  const isPopular = plan.isPopular;

  return (
    <div
      className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300
        ${isPopular
          ? 'card-popular-glow bg-white scale-[1.03] z-10'
          : 'border border-charcoal-100 bg-white hover:shadow-card-hover hover:-translate-y-1'
        }`}
    >
      {/* Popular banner */}
      {isPopular && (
        <div className="bg-gradient-to-r from-canvas-500 to-terracotta-500 text-white text-center text-xs font-bold py-2 flex items-center justify-center gap-1.5 tracking-wide">
          <Star className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true" />
          MOST POPULAR
        </div>
      )}

      <div className={`p-6 flex flex-col flex-1 ${isPopular ? 'pt-5' : 'pt-6'}`}>

        {/* Header */}
        <div className="mb-5">
          {/* Tier icon */}
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${TIER_GRADIENT[plan.slug] || 'from-charcoal-100 to-charcoal-50'} flex items-center justify-center mb-3 shadow-sm`}>
            {plan.slug === 'studio'
              ? <Crown className="w-5 h-5 text-canvas-300" aria-hidden="true" />
              : isPopular
                ? <Zap className="w-5 h-5 text-white" aria-hidden="true" />
                : <Star className="w-5 h-5 text-charcoal-400" aria-hidden="true" />
            }
          </div>
          <h3 className="font-display font-bold text-2xl text-charcoal-900 mb-1 leading-tight">
            {plan.name}
          </h3>
          <p className="text-charcoal-500 text-sm leading-relaxed">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6 pb-5 border-b border-charcoal-100">
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-display font-bold text-charcoal-900 leading-none">
              ₹{plan.price.toLocaleString('en-IN')}
            </span>
            <span className="text-charcoal-400 text-sm mb-1">
              /{plan.billingPeriod === 'yearly' ? 'yr' : 'mo'}
            </span>
          </div>
          {plan.billingPeriod === 'yearly' && (
            <p className="text-xs text-canvas-600 font-medium mt-1.5 flex items-center gap-1">
              <span className="badge-success badge">Save 20%</span>
              vs monthly
            </p>
          )}
          {plan.billingPeriod === 'monthly' && plan.price > 0 && (
            <p className="text-xs text-charcoal-400 mt-1.5">Billed monthly · Cancel anytime</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-7 flex-1" aria-label={`${plan.name} plan features`}>
          {plan.features?.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-charcoal-700">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                isPopular ? 'bg-canvas-100' : 'bg-sage-50'
              }`}>
                <Check
                  className={`w-3 h-3 ${isPopular ? 'text-canvas-600' : 'text-sage-600'}`}
                  aria-hidden="true"
                />
              </div>
              <span className="leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrentPlan ? (
          <div className="btn btn-sm w-full justify-center bg-sage-50 text-sage-700 border border-sage-200 cursor-default" aria-label="Current plan" aria-current="true">
            <Check className="w-4 h-4" aria-hidden="true" /> Current Plan
          </div>
        ) : (
          <button
            onClick={() => onSelect?.(plan)}
            className={`btn btn-sm w-full justify-center font-semibold active:scale-[0.97] ${
              isPopular
                ? 'bg-gradient-to-r from-canvas-500 to-canvas-600 text-white hover:from-canvas-600 hover:to-canvas-700 shadow-art hover:shadow-art-lg hover:-translate-y-0.5 transition-all'
                : plan.price === 0
                  ? 'border-2 border-charcoal-200 text-charcoal-700 hover:border-charcoal-400 hover:bg-charcoal-50'
                  : 'border-2 border-canvas-500 text-canvas-600 hover:bg-canvas-500 hover:text-white transition-all'
            }`}
            aria-label={`Subscribe to ${plan.name} plan`}
          >
            {plan.price === 0
              ? 'Get Started Free'
              : <><Zap className="w-4 h-4" aria-hidden="true" /> {user ? 'Subscribe Now' : 'Get Started'}</>
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
