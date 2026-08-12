import React, { useState } from 'react';
import { Scale, Lock, ShieldCheck, ArrowLeft, Calculator, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ExpertAdvocateCard from './ExpertAdvocateCard';
import ExpertAdviceModal from './ExpertAdviceModal';
import PaymentModal from './PaymentModal';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

export const MALE_RERA_ADVOCATE = {
  id: 'adv_pr_1',
  name: 'Adv and Notary Jaydeep Thakur',
  experienceYears: 18,
  location: 'Pune & Mumbai',
  practiceArea: 'RERA Disputes, Property Litigation, High Court Execution',
  maskedPhone: '+91 98810****85',
  fullPhone: '+91 98810 54785',
  email: 'jaythakur2008@gmail.com',
  maskedEmail: 'j*********8@gmail.com',
  avatar: '/avatars/male_advocate.png',
  isVerified: true,
  rating: 4.95,
  stateId: 'maharashtra',
  court: 'Pune Bar council and bombay High Court'
};

export default function ExpertLegalAdvicePage() {
  const navigate = useNavigate();
  const { user, hasLegalGuidanceAccess } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState(MALE_RERA_ADVOCATE);

  const isUnlocked = hasLegalGuidanceAccess('DEFAULT');

  const handleCardClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setConsultModalOpen(true);
  };

  const handleProceedToPayment = () => {
    setConsultModalOpen(false);
    setPaymentModalOpen(true);
  };

  return (
    <div className="expert-page-container" style={{ maxWidth: '840px', margin: '40px auto', padding: '0 20px' }}>
      {/* Navigation actions bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Link to="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Back to Services
        </Link>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/select-state')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0f766e', fontWeight: 600 }}
        >
          <Calculator size={15} /> Open RERA Interest Calculator <ArrowRight size={14} />
        </button>
      </div>

      <div className="section-head-wrap" style={{ textAlign: 'left', marginBottom: 24 }}>
        <div className="section-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          <Scale size={14} /> Verified RERA Advocate
        </div>
        <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Expert Legal Advice & 1-on-1 Advocate Consultation</h2>
        <p className="section-subtitle">
          Connect directly with a senior property law specialist for Form M complaint review, builder delay penalty recovery & High Court execution orders.
        </p>
      </div>

      {/* Unlock Notice Banner */}
      {!isUnlocked && (
        <div className="unlock-access-banner" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: '0.9rem' }}>
          <Lock size={18} style={{ color: '#d97706', flexShrink: 0 }} />
          <span>To unlock full direct access and phone consultation with the lawyer, complete payment.</span>
        </div>
      )}

      {/* Male Advocate Profile Card */}
      <div className="advocate-page-card-wrap">
        <ExpertAdvocateCard
          advocate={MALE_RERA_ADVOCATE}
          isUnlocked={isUnlocked}
          onConsult={handleCardClick}
        />
      </div>

      {/* Calculator Cross Redirection Banner at Bottom */}
      <div style={{ marginTop: 40, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px 24px', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--ink)' }}>Need to calculate builder delay interest?</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Use our Section 18 compensation calculator for exact SBI MCLR rate calculation.</p>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-sm"
          onClick={() => navigate('/select-state')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Calculator size={15} /> Open Calculator <ArrowRight size={14} />
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setConsultModalOpen(true);
        }}
      />

      {/* Consult Details Modal */}
      <ExpertAdviceModal
        isOpen={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        advocate={selectedAdvocate}
        isUnlocked={isUnlocked}
        onProceedToPayment={handleProceedToPayment}
      />

      {/* Razorpay Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setPaymentModalOpen(false);
          setConsultModalOpen(true);
        }}
        defaultPlan="legal_guidance"
        initialReraId="DEFAULT"
      />

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '24px' }}>
        For support or queries, contact: <strong>shiftlogic@gmail.com</strong>
      </p>
    </div>
  );
}
