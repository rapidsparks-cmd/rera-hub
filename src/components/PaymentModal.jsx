import { useEffect, useRef, useState } from 'react';
import { X, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RENDER_API_URL = import.meta.env.VITE_RENDER_API_URL || '';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
const PREMIUM_PRICE = 499;

/**
 * PaymentModal — Razorpay checkout flow.
 * Props:
 *   isOpen    {boolean}
 *   onClose   {function}
 *   onSuccess {function}  called after payment is captured & premium refreshed
 */
export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const { user, refreshPremium } = useAuth();

  const [phase, setPhase] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const rzpRef = useRef(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setPhase('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && phase !== 'loading') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, phase, onClose]);

  if (!isOpen) return null;

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

    // 1. Load Razorpay script dynamically
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPhase('error');
      setErrorMsg('Failed to load payment gateway. Check your internet connection and try again.');
      return;
    }

    // 2. Create order on backend
    let order;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${RENDER_API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}), // amount is hard-coded server-side
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      const data = await res.json();

      // Already premium — no need to pay again
      if (data.alreadyPremium) {
        await refreshPremium();
        setPhase('success');
        onSuccess?.();
        return;
      }

      order = data;
    } catch (err) {
      setPhase('error');
      setErrorMsg(`Could not create payment order: ${err.message}`);
      return;
    }

    // 3. Open Razorpay checkout popup
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'RERA Hub',
      description: 'Premium — Form M Download Access',
      order_id: order.id,
      prefill: {
        email: user.email || '',
        name: user.displayName || '',
      },
      theme: { color: '#0f766e' },
      modal: {
        ondismiss: () => {
          // User closed the Razorpay popup without paying
          if (phase === 'loading') setPhase('idle');
        },
      },
      handler: async (response) => {
        // Payment successful on client — webhook will confirm server-side.
        // We wait a moment for the webhook to fire, then refresh premium status.
        setPhase('loading');
        // Give the webhook ~2s to process before checking status
        await new Promise((r) => setTimeout(r, 2000));
        await refreshPremium();
        setPhase('success');
        onSuccess?.();
      },
    };

    if (!RAZORPAY_KEY_ID) {
      setPhase('error');
      setErrorMsg('Payment gateway is not configured. Please contact support.');
      return;
    }

    rzpRef.current = new window.Razorpay(options);
    rzpRef.current.on('payment.failed', (response) => {
      setPhase('error');
      setErrorMsg(
        response.error?.description || 'Payment failed. Please try a different payment method.'
      );
    });
    rzpRef.current.open();
    // Note: setPhase back to idle happens in modal.ondismiss if user closes
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
            <h2>You're premium! 🎉</h2>
            <p className="muted">
              Form M downloads are now unlocked. Thank you for supporting RERA Hub.
            </p>
            <button className="btn btn-accent btn-lg" onClick={onClose}>
              Start downloading
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="payment-result">
            <AlertTriangle size={52} className="payment-result-icon error" />
            <h2>Payment issue</h2>
            <p className="muted">{errorMsg}</p>
            <div className="payment-result-actions">
              <button className="btn btn-accent" onClick={() => setPhase('idle')}>
                Try again
              </button>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
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

        {/* IDLE — main CTA */}
        {phase === 'idle' && (
          <>
            <div className="modal-header">
              <div>
                <p className="eyebrow">RERA Hub Premium</p>
                <h2 id="payment-modal-title">Unlock Form M downloads</h2>
              </div>
            </div>

            <div className="premium-features-list">
              <div className="premium-feature">
                <CheckCircle size={16} className="pf-icon" />
                <span>Download Form M complaint as <strong>PDF</strong></span>
              </div>
              <div className="premium-feature">
                <CheckCircle size={16} className="pf-icon" />
                <span>Download Form M complaint as <strong>Word (.doc)</strong></span>
              </div>
              <div className="premium-feature">
                <CheckCircle size={16} className="pf-icon" />
                <span>Print-ready RERA interest report</span>
              </div>
              <div className="premium-feature">
                <CheckCircle size={16} className="pf-icon" />
                <span>One-time payment — lifetime access</span>
              </div>
            </div>

            <div className="payment-price-row">
              <div className="payment-price">
                <span className="price-amount">₹499</span>
                <span className="price-note muted">one-time · no subscription</span>
              </div>
              <Lock size={16} className="muted" />
            </div>

            <button
              id="payment-pay-btn"
              type="button"
              className="btn btn-accent btn-lg"
              onClick={handlePay}
              disabled={phase === 'loading'}
            >
              Pay ₹499 securely
            </button>

            <p className="payment-secure-note muted">
              Payments powered by Razorpay · UPI, cards, net banking accepted
            </p>
          </>
        )}
      </div>
    </div>
  );
}
