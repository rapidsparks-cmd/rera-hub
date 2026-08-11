import { useEffect, useRef, useState } from 'react';
import { X, Lock, CheckCircle, AlertTriangle, FileText, Scale, Check, ShieldCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RENDER_API_URL = import.meta.env.VITE_RENDER_API_URL || '';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

/**
 * PaymentModal — Tiered Razorpay checkout flow supporting 3 services:
 * 1. Breakdown Report (₹29)
 * 2. Form M Litigation (₹49, upgrade ₹20 if breakdown owned)
 * 3. Expert Legal Guidance (₹299, upgrade ₹250 if Form M owned, ₹270 if breakdown owned)
 */
export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = 'form_m',
  initialReraId = '',
}) {
  const { user, hasBreakdownAccess, hasFormMAccess, refreshEntitlements } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [reraId, setReraId] = useState(initialReraId);
  const [phase, setPhase] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const rzpRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('idle');
      setErrorMsg('');
      setSelectedPlan(defaultPlan || 'form_m');
      setReraId(initialReraId || '');
    }
  }, [isOpen, defaultPlan, initialReraId]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && phase !== 'loading') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, phase, onClose]);

  if (!isOpen) return null;

  const isLegalAdvicePayment = selectedPlan === 'legal_guidance';
  const normalizedReraId = isLegalAdvicePayment ? 'DEFAULT' : (reraId.trim() || 'DEFAULT').toUpperCase();

  const alreadyHasBreakdown = hasBreakdownAccess(normalizedReraId);
  const alreadyHasFormM = hasFormMAccess(normalizedReraId);

  // Exact price calculation for all 3 services
  let price = 29;
  let isUpgrade = false;
  let upgradeNote = '';

  if (selectedPlan === 'breakdown') {
    price = 29;
  } else if (selectedPlan === 'form_m') {
    if (alreadyHasBreakdown) {
      price = 20; // ₹49 - ₹29
      isUpgrade = true;
      upgradeNote = '(₹29 breakdown credit applied)';
    } else {
      price = 49;
    }
  } else if (selectedPlan === 'legal_guidance') {
    if (alreadyHasFormM) {
      price = 250; // ₹299 - ₹49
      isUpgrade = true;
      upgradeNote = '(₹49 Form M credit applied)';
    } else if (alreadyHasBreakdown) {
      price = 270; // ₹299 - ₹29
      isUpgrade = true;
      upgradeNote = '(₹29 breakdown credit applied)';
    } else {
      price = 299;
    }
  }

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    if (!user) return;

    setPhase('loading');
    setErrorMsg('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPhase('error');
      setErrorMsg('Failed to load payment gateway. Please check your internet connection.');
      return;
    }

    let order;
    try {
      const idToken = typeof user.getIdToken === 'function' ? await user.getIdToken() : 'demo-token';
      const res = await fetch(`${RENDER_API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          reraId: normalizedReraId,
        }),
      });

      const text = await res.text().catch(() => '');

      if (!res.ok) {
        let errorMsg = `Server error ${res.status}`;
        try {
          if (text) {
            const body = JSON.parse(text);
            errorMsg = body.error || errorMsg;
          }
        } catch (_) {
          if (text && text.trim().startsWith('<!DOCTYPE html>')) {
            errorMsg = `Server returned an HTML page (404/502). Please verify your VITE_RENDER_API_URL environment variable.`;
          } else if (text && text.length < 200) {
            errorMsg = text;
          }
        }
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        if (text && text.trim().startsWith('<!DOCTYPE html>')) {
          throw new Error('Server returned an HTML page instead of JSON. Please verify your VITE_RENDER_API_URL environment variable.');
        }
        throw new Error(`Invalid server response format: ${text ? text.slice(0, 150) : 'empty'}`);
      }

      if (data.alreadyUnlocked) {
        await refreshEntitlements();
        setPhase('success');
        onSuccess?.();
        return;
      }

      order = data;
    } catch (err) {
      console.warn('[PaymentModal] Live order creation failed:', err.message);
      setPhase('error');
      setErrorMsg(`Failed to initiate live payment: ${err.message}. Please check if backend server is running.`);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'RERA Hub',
      description:
        selectedPlan === 'legal_guidance'
          ? `Expert Legal Advice & 1-on-1 Advocate Consultation`
          : selectedPlan === 'form_m'
          ? `Form M Litigation Complaint (${normalizedReraId})`
          : `Section 18 Breakdown Report (${normalizedReraId})`,
      order_id: order.id,
      prefill: {
        email: user.email || '',
        name: user.displayName || '',
      },
      theme: { color: '#0f766e' },
      modal: {
        ondismiss: () => {
          setPhase('idle');
        },
      },
      handler: async (response) => {
        setPhase('loading');
        try {
          const idToken = typeof user.getIdToken === 'function' ? await user.getIdToken() : 'demo-token';
          await fetch(`${RENDER_API_URL}/api/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
        } catch (err) {
          console.warn('[PaymentModal] verify-payment network call warning:', err.message);
        }
        await refreshEntitlements();
        setPhase('success');
        onSuccess?.();
      },
    };

    rzpRef.current = new window.Razorpay(options);
    rzpRef.current.on('payment.failed', (response) => {
      setPhase('error');
      setErrorMsg(
        response.error?.description || 'Payment failed. Please try another payment method.'
      );
    });
    rzpRef.current.open();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={(e) => e.target === e.currentTarget && phase !== 'loading' && onClose()}
    >
      <div className="modal-card payment-modal">
        {phase !== 'loading' && (
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        )}

        {/* SUCCESS */}
        {phase === 'success' && (
          <div className="payment-result">
            <CheckCircle size={52} className="payment-result-icon success" />
            <h2>Access Unlocked! 🎉</h2>
            <p className="muted">
              {isLegalAdvicePayment
                ? 'Your 1-on-1 Legal Advice & Advocate Consultation is unlocked!'
                : `Unlimited downloads and edits are unlocked for RERA ID: ${normalizedReraId}`}
            </p>
            <button className="btn btn-accent btn-lg" onClick={onClose}>
              Continue to Downloads & Consultation
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="payment-result">
            <AlertTriangle size={52} className="payment-result-icon error" />
            <h2>Payment Issue</h2>
            <p className="muted">{errorMsg}</p>
            <div className="payment-result-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div className="payment-result">
            <div className="payment-spinner" aria-label="Processing…" />
            <p className="muted" style={{ marginTop: 16 }}>Processing your payment…</p>
          </div>
        )}

        {/* IDLE — Plan Selection & Checkout */}
        {phase === 'idle' && (
          <>
            {isLegalAdvicePayment ? (
              /* EXPERT LEGAL ADVICE DEDICATED CHECKOUT SUMMARY */
              <div>
                <div className="modal-header">
                  <div className="eyebrow-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                    <Scale size={13} /> Verified RERA Advocate Consultation
                  </div>
                  <h2 id="payment-modal-title">Unlock Legal Consultation</h2>
                  <p className="muted" style={{ fontSize: '0.85rem' }}>
                    Complete payment to unmask advocate phone contact & schedule direct 1-on-1 consultation.
                  </p>
                </div>

                <div className="consult-price-card" style={{ marginTop: 18, marginBottom: 20 }}>
                  <div className="price-details">
                    <span className="price-title">1-on-1 Phone Consultation & Form M Legal Review</span>
                    <span className="price-amount">₹{price} <span className="strike-price">₹1,499</span></span>
                  </div>
                  <ul className="price-features">
                    <li><ShieldCheck size={14} /> Direct Unmasked Phone Contact & WhatsApp Access</li>
                    <li><CheckCircle2 size={14} /> Full Form M Complaint petition document review & legal guidance</li>
                  </ul>
                  {isUpgrade && <p style={{ fontSize: '0.8rem', color: '#d97706', margin: '8px 0 0 0', fontWeight: 600 }}>{upgradeNote}</p>}
                </div>

                <button type="button" className="btn btn-accent btn-lg w-full" onClick={handlePay}>
                  <Lock size={16} /> Pay ₹{price} to Unlock Lawyer Contact
                </button>
              </div>
            ) : (
              /* CALCULATOR PLANS CHECKOUT (BREAKDOWN / FORM M) */
              <div>
                <div className="modal-header">
                  <div>
                    <p className="eyebrow">RERA Hub Access</p>
                    <h2 id="payment-modal-title">Choose Calculator Plan</h2>
                    <p className="muted" style={{ fontSize: '0.85rem' }}>
                      Select the plan that matches your calculation & petition drafting needs
                    </p>
                  </div>
                </div>

                {/* RERA ID Input */}
                <div className="field" style={{ marginBottom: 16 }}>
                  <span className="field-label">RERA Registration / Project ID</span>
                  <input
                    type="text"
                    value={reraId}
                    onChange={(e) => setReraId(e.target.value)}
                    placeholder="e.g. PRM/KA/RERA/1251/..."
                    style={{ fontSize: '0.875rem' }}
                  />
                  <span className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    Purchases apply to this RERA ID with unlimited edits.
                  </span>
                </div>

                {/* Plan selection cards for Calculator */}
                <div className="plan-cards">
                  {/* Plan 1: Breakdown Report ₹29 */}
                  <div
                    className={`plan-card ${selectedPlan === 'breakdown' ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan('breakdown')}
                  >
                    <div className="plan-card-header">
                      <div className="plan-title-wrap">
                        <FileText size={18} className="plan-icon" />
                        <div>
                          <strong>Breakdown Report</strong>
                          <span className="plan-price">₹29</span>
                        </div>
                      </div>
                      {selectedPlan === 'breakdown' && <Check size={16} className="plan-check" />}
                    </div>
                    <p className="plan-desc" style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0 24px' }}>
                      Full interest calculation report with PDF/print options.
                    </p>
                  </div>

                  {/* Plan 2: Form M Litigation ₹49 */}
                  <div
                    className={`plan-card ${selectedPlan === 'form_m' ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan('form_m')}
                  >
                    <div className="plan-card-header">
                      <div className="plan-title-wrap">
                        <Scale size={18} className="plan-icon" />
                        <div>
                          <strong>Form M Litigation</strong>
                          <span className="plan-price">
                            {selectedPlan === 'form_m' && isUpgrade ? '₹20' : '₹49'}
                            {selectedPlan === 'form_m' && isUpgrade && (
                              <span className="upgrade-note"> (₹29 credit applied)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      {selectedPlan === 'form_m' && <Check size={16} className="plan-check" />}
                    </div>
                    <p className="plan-desc" style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0 0 24px' }}>
                      Draft your official RERA complaint petition (Word + PDF).
                    </p>
                  </div>
                </div>

                <button type="button" className="btn btn-accent btn-lg w-full" onClick={handlePay}>
                  <Lock size={16} /> Pay ₹{price} to Unlock
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
