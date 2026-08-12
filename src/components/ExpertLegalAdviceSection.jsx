import React, { useState } from 'react';
import { Scale, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import ExpertAdvocateCard from './ExpertAdvocateCard';
import ExpertAdviceModal from './ExpertAdviceModal';
import { useAuth } from '../context/AuthContext';

export const MALE_RERA_ADVOCATE = {
  id: 'adv_pr_1',
  name: 'Adv and Notary Jaydeep Thakur',
  experienceYears: 18,
  location: 'Pune & Mumbai',
  practiceArea: 'RERA Disputes, Property Litigation, High Court Execution',
  maskedPhone: '+91 94225****24',
  fullPhone: '+91 94225 12724',
  email: 'jaythakur2008@gmail.com',
  maskedEmail: 'j*********8@gmail.com',
  avatar: '/avatars/male_advocate.png',
  isVerified: true,
  rating: 4.95,
  stateId: 'maharashtra',
  court: 'Pune Bar council and bombay High Court'
};

export default function ExpertLegalAdviceSection({
  stateId = '',
  onOpenPayment,
  onOpenAuth,
}) {
  const { user, hasLegalGuidanceAccess } = useAuth();
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isUnlocked = hasLegalGuidanceAccess((stateId || 'DEFAULT').toUpperCase());

  const handleCardConsult = (advocate) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setSelectedAdvocate(advocate || MALE_RERA_ADVOCATE);
    setModalOpen(true);
  };

  const handleProceedToPayment = (consultDetails) => {
    setModalOpen(false);
    if (onOpenPayment) {
      onOpenPayment({
        plan: 'legal_guidance',
        advocate: consultDetails?.advocate,
      });
    }
  };

  return (
    <section id="expert-legal-advice" className="expert-advice-section">
      <div className="section-head-wrap">
        <div className="section-badge">
          <Scale size={14} /> Verified RERA Advocates
        </div>
        <h3 className="section-title">Expert Legal Advice & Advocate Consultation</h3>
        <p className="section-subtitle">
          Connect 1-on-1 with senior property lawyers for Form M legal complaint review, builder delay penalty recovery, and High Court execution orders.
        </p>
      </div>

      {/* Unlock Notice Banner */}
      {!isUnlocked && (
        <div className="unlock-access-banner">
          <Lock size={16} className="banner-lock-icon" />
          <span>To unlock full direct access and phone consultation with the lawyer, complete payment.</span>
        </div>
      )}

      <div className="advocates-grid">
        <ExpertAdvocateCard
          advocate={MALE_RERA_ADVOCATE}
          isUnlocked={isUnlocked}
          onConsult={handleCardConsult}
        />
      </div>

      {/* Modal */}
      <ExpertAdviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        advocate={selectedAdvocate || MALE_RERA_ADVOCATE}
        reraId={stateId}
        isUnlocked={isUnlocked}
        onProceedToPayment={handleProceedToPayment}
      />

      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '24px' }}>
        For support or queries, contact: <strong>shiftlogic@gmail.com</strong>
      </p>
    </section>
  );
}
