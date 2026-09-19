import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  Sparkles,
  Zap,
  Crown,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI / QR Code',
    desc: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: Smartphone,
    badge: 'Fastest',
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay, Amex',
    icon: CreditCard,
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    desc: 'HDFC, ICICI, SBI, Axis & 50+ banks',
    icon: Building2,
  },
];

const CheckoutModal = ({ plan, isOpen, onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('artlover@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('382');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen || !plan) return null;

  const basePrice = plan.price || 0;
  const isYearly = plan.billingPeriod === 'yearly';

  const handlePay = async (e) => {
    e?.preventDefault();
    if (processing || isCompleted) return;

    setProcessing(true);

    try {
      // Step 1: Initialize order
      setProcessingStep('Creating secure order...');
      const { data: initData } = await api.post('/subscriptions/subscribe', {
        planId: plan._id,
      });
      const checkout = initData.checkout || {};

      // Step 2: Simulate Gateway Processing
      await new Promise((r) => setTimeout(r, 700));
      setProcessingStep(`Processing ₹${basePrice.toLocaleString('en-IN')} via ${selectedMethod.toUpperCase()}...`);

      await new Promise((r) => setTimeout(r, 800));
      setProcessingStep('Authorizing payment with bank gateway...');

      // Step 3: Verify and activate subscription on backend
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep('Activating your ArtCrew membership...');

      const mockPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verifyRes = await api.post('/subscriptions/verify-payment', {
        razorpay_order_id: checkout.orderId || `order_sim_${Date.now()}`,
        razorpay_payment_id: mockPaymentId,
        planId: plan._id,
      });

      if (verifyRes.data.success) {
        setIsCompleted(true);
        await refreshUser();
        toast.success(`🎉 Welcome to ${plan.name}! Your subscription is active.`);
        setTimeout(() => {
          onSuccess?.(plan);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('[CheckoutModal] Payment error:', err);
      toast.error(err.response?.data?.message || 'Payment simulation failed. Please try again.');
      setProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-charcoal-100 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-canvas-600 via-terracotta-500 to-canvas-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              {plan.slug === 'studio' ? (
                <Crown className="w-5 h-5 text-canvas-200" />
              ) : (
                <Zap className="w-5 h-5 text-canvas-100" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white/95">
                  ArtCrew Checkout
                </span>
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" /> 256-bit Encrypted
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mt-0.5">
                Complete Your Subscription
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={processing}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Plan Summary Card */}
          <div className="bg-canvas-50/60 border border-canvas-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-charcoal-900">
                  {plan.name} Plan
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-canvas-100 text-canvas-800 border border-canvas-200">
                  {isYearly ? 'Annual Billing' : 'Monthly Billing'}
                </span>
              </div>
              <p className="text-sm text-charcoal-600">
                Unlock full masterclasses, live artist workshops, and AI advisor
              </p>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <div className="text-3xl font-display font-bold text-charcoal-950">
                ₹{basePrice.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-charcoal-500">
                /{isYearly ? 'year' : 'month'} · Incl. all taxes
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-charcoal-900 flex items-center justify-between">
              <span>Select Payment Method</span>
              <span className="text-xs text-charcoal-400 font-normal">
                Sandbox / Test Mode Active
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const active = selectedMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      active
                        ? 'border-canvas-500 bg-canvas-50/40 ring-2 ring-canvas-500/20 shadow-sm'
                        : 'border-charcoal-200 hover:border-charcoal-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          active ? 'bg-canvas-500 text-white' : 'bg-charcoal-100 text-charcoal-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {pm.badge && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                          {pm.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-charcoal-900 leading-tight">
                        {pm.name}
                      </div>
                      <div className="text-[11px] text-charcoal-500 mt-0.5 line-clamp-1">
                        {pm.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Method Details */}
          <div className="bg-charcoal-50/70 border border-charcoal-200/80 rounded-2xl p-4 sm:p-5">
            {selectedMethod === 'upi' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-charcoal-700">
                    Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-Verified
                  </span>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-sm font-medium text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-canvas-500"
                />
                <p className="text-[11px] text-charcoal-500">
                  Test UPI addresses pre-configured for sandbox checkout simulation.
                </p>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• 8892"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-sm font-mono text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-canvas-500"
                    />
                    <CreditCard className="w-4 h-4 text-charcoal-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-sm font-mono text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-canvas-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-sm font-mono text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-canvas-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-charcoal-700 block">
                  Select Popular Bank
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        selectedBank === b
                          ? 'border-canvas-500 bg-canvas-50 text-canvas-800 font-bold'
                          : 'border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Account Details Confirmation */}
          <div className="flex items-center justify-between text-xs text-charcoal-500 border-t border-charcoal-100 pt-4">
            <div>
              Subscribing as: <strong className="text-charcoal-800">{user?.name || 'ArtCrew Member'}</strong> ({user?.email})
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <Lock className="w-3 h-3" /> Secure Connection
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            {isCompleted ? (
              <div className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 animate-fade-in">
                <CheckCircle className="w-5 h-5 animate-bounce" />
                Subscription Activated! Redirecting...
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-canvas-600 via-canvas-500 to-terracotta-500 text-white font-bold text-base shadow-art-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{processingStep || 'Processing Payment...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Pay ₹{basePrice.toLocaleString('en-IN')} & Activate Membership</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-[11px] text-center text-charcoal-400">
            By confirming payment, you authorize immediate activation of your membership benefits.
            You can manage or cancel your subscription anytime from Account Settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
