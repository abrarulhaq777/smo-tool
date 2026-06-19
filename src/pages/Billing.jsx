import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { CreditCard, Check, Sparkles, RefreshCw, X } from 'lucide-react';

export const Billing = () => {
  const { setUser, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [activeSub, setActiveSub] = useState({ plan: 'FREE', status: 'Active', endDate: null });
  
  // Checkout simulator state
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions/status');
      setActiveSub(res.data.data);
    } catch {
      addNotification('error', 'Failed to retrieve active billing logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleCheckout = async (plan) => {
    setLoading(true);
    try {
      const res = await api.post('/subscriptions/checkout', { plan });
      const order = res.data.data;
      setCheckoutOrder(order);
    } catch (err) {
      addNotification('error', 'Failed to create checkout order');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!checkoutOrder) return;
    setProcessingPayment(true);
    try {
      await api.post('/subscriptions/verify', {
        plan: checkoutOrder.plan,
        razorpayOrderId: checkoutOrder.orderId,
        razorpayPaymentId: `pay_mock_${Math.floor(100000 + Math.random() * 900000)}`,
        razorpaySignature: 'mock_signature_verification_success',
      });

      addNotification('success', `Payment verified! Account upgraded to ${checkoutOrder.plan}.`);
      setCheckoutOrder(null);
      
      // Update session details
      const profileRes = await api.get('/auth/profile');
      setUser(profileRes.data.user);

      fetchSubscription();
    } catch {
      addNotification('error', 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSub = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? Your account will revert back to the FREE limits.')) return;
    setLoading(true);
    try {
      await api.post('/subscriptions/cancel');
      addNotification('success', 'Subscription cancelled successfully.');
      
      // Sync profile
      const profileRes = await api.get('/auth/profile');
      setUser(profileRes.data.user);

      fetchSubscription();
    } catch {
      addNotification('error', 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      level: 'FREE',
      price: '₹0',
      description: 'Perfect for exploring local niches and starter post ideas.',
      features: [
        '1 Active Client Project',
        '10 Competitor Scrapes / mo',
        '10 Strategy Generations / mo',
        'Basic Social Post Checklist',
      ],
      action: 'Current Plan',
    },
    {
      level: 'PRO',
      price: '₹999',
      description: 'Ideal for independent digital marketers managing multiple shop campaigns.',
      features: [
        '5 Active Client Projects',
        '50 Competitor Scrapes / mo',
        '50 Strategy Generations / mo',
        'Gemini AI Growth Advisor',
        'Copy-to-Clipboard caption tools',
        'PDF Strategy Exports',
      ],
      action: 'Upgrade to PRO',
    },
    {
      level: 'AGENCY',
      price: '₹4,999',
      description: 'Built for professional marketing firms and social media agencies.',
      features: [
        'Unlimited Client Projects',
        'Unlimited Competitor Scrapes',
        'Unlimited Strategy Generations',
        'Unlimited AI Analytics Advice',
        'Priority email response',
        'Collaborator Admin Controls',
      ],
      action: 'Upgrade to AGENCY',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Pricing</h1>
        <p className="text-sm text-muted-foreground">Select the workspace plan that fits your clients and agency scale</p>
      </div>

      {/* Subscription Summary Panel */}
      <div className="glass-panel p-6 rounded-xl border border-card-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Subscription Status</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-foreground capitalize">{activeSub.plan} Plan</span>
              <span className="text-xs text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/20 font-medium">
                {activeSub.status}
              </span>
            </div>
            {activeSub.endDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Renews on: {new Date(activeSub.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {activeSub.plan !== 'FREE' && (
          <button
            onClick={handleCancelSub}
            disabled={loading}
            className="px-4 py-2 border border-destructive/20 hover:bg-destructive/10 text-destructive text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = activeSub.plan === p.level && activeSub.status === 'Active';

          return (
            <div
              key={p.level}
              className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrent 
                  ? 'border-primary shadow-lg shadow-primary/5 bg-primary/5' 
                  : 'border-card-border hover:border-card-border/80'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground capitalize">{p.level}</h3>
                  {isCurrent && (
                    <span className="text-[9px] uppercase font-bold text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                <div className="border-t border-card-border/50 my-2" />

                <ul className="space-y-2">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2 bg-card border border-card-border text-xs text-muted-foreground font-semibold rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : p.level === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-2 bg-card border border-card-border text-xs text-muted-foreground font-semibold rounded-lg cursor-not-allowed"
                  >
                    Downgrade Free (Use Cancel)
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(p.level)}
                    disabled={loading}
                    className={`w-full py-2 text-xs font-semibold rounded-lg transition-all ${
                      p.level === 'AGENCY'
                        ? 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/10 text-white'
                        : 'bg-card border border-card-border hover:bg-card/75 text-foreground'
                    }`}
                  >
                    {p.action}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Payment modal */}
      {checkoutOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-panel-glow max-w-md w-full p-6 rounded-xl border border-card-border relative animate-in zoom-in duration-200">
            <button
              onClick={() => setCheckoutOrder(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-secondary" />
              <span>Razorpay Checkout Simulator</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-6">Demo environment detected. Payments are processed offline.</p>

            <div className="p-4 rounded-lg bg-card/45 border border-card-border space-y-3 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Upgrading Plan:</span>
                <span className="font-bold text-foreground capitalize">{checkoutOrder.plan}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Payment Amount:</span>
                <span className="font-bold text-foreground">{checkoutOrder.currency} {checkoutOrder.amount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Simulated Order:</span>
                <span className="font-mono text-foreground text-[10px]">{checkoutOrder.orderId}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSimulatePayment}
                disabled={processingPayment}
                className="w-full py-2.5 bg-success hover:bg-success/80 text-white rounded-lg text-sm font-semibold shadow-md shadow-success/10 transition-colors flex items-center justify-center gap-1.5"
              >
                {processingPayment ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Simulate Payment Success</span>
              </button>
              <button
                onClick={() => setCheckoutOrder(null)}
                className="w-full py-2 border border-card-border hover:bg-card/25 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
