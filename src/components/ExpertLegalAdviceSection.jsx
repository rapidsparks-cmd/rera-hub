import React, { useState } from 'react';
import { Scale, ShieldCheck, Sparkles, Phone, Lock } from 'lucide-react';
import ExpertAdvocateCard from './ExpertAdvocateCard';
import ExpertAdviceModal from './ExpertAdviceModal';
import { useAuth } from '../context/AuthContext';

export const TOP_RERA_ADVOCATES = [
  {
    id: 'adv_1',
    name: 'Adv. P. R. Sxxxxxxxli',
    experienceYears: 29,
    location: 'Bangalore',
    practiceArea: 'RERA Litigation + 2 more',
    maskedPhone: '+91 6644****52',
    fullPhone: '+91 98451 66452',
    avatar: '/avatars/female_advocate.png',
    isVerified: true,
    rating: 4.9,
    stateId: 'karnataka',
  },
  {
    id: 'adv_2',
    name: 'Adv. R. K. Deshmukh',
    experienceYears: 22,
    location: 'Mumbai / High Court',
    practiceArea: 'MahaRERA Section 18 + 3 more',
    maskedPhone: '+91 9820****41',
    fullPhone: '+91 98204 12841',
    avatar: '/avatars/male_advocate.png',
    isVerified: true,
    rating: 4.85,
    stateId: 'maharashtra',
  },
  {
    id: 'adv_3',
    name: 'Adv. Ananya Roy',
    experienceYears: 18,
    location: 'Delhi NCR',
    practiceArea: 'RERA Refund & Appeals + 2 more',
    maskedPhone: '+91 9811****78',
    fullPhone: '+91 98115 99878',
    avatar: '/avatars/female_advocate.png',
    isVerified: true,
    rating: 4.92,
    stateId: 'delhi',
  },
];

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
    setSelectedAdvocate(advocate);
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
          <Scale size={14} /> Expert Legal Support
        </div>
        <h3 className="section-title">Verified RERA Advocates & Legal Advice</h3>
        <p className="section-subtitle">
          Connect 1-on-1 with senior property lawyers for Form M legal review, builder delay penalty recovery, and High Court execution orders.
        </p>
      </div>

      <div className="advocates-grid">
        {TOP_RERA_ADVOCATES.map((adv) => (
          <ExpertAdvocateCard
            key={adv.id}
            advocate={adv}
            isUnlocked={isUnlocked}
            onConsult={handleCardConsult}
          />
        ))}
      </div>

      {/* Modal */}
      <ExpertAdviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        advocate={selectedAdvocate}
        reraId={stateId}
        isUnlocked={isUnlocked}
        onProceedToPayment={handleProceedToPayment}
      />
    </section>
  );
}
