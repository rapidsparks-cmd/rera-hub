import React, { useState } from 'react';
import { X, Phone, MessageSquare, ShieldCheck, CheckCircle2, Lock, Clock, Calendar, Sparkles } from 'lucide-react';
import ExpertAdvocateCard from './ExpertAdvocateCard';
import { useAuth } from '../context/AuthContext';

export default function ExpertAdviceModal({
  isOpen,
  onClose,
  advocate,
  reraId = '',
  onProceedToPayment,
  isUnlocked = false,
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Form M Litigation & Legal Review');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !advocate) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (onProceedToPayment) {
      onProceedToPayment({
        advocate,
        fullName,
        phone,
        topic,
        notes,
      });
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expert-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card expert-advice-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="eyebrow-badge">
            <Sparkles size={13} /> Expert RERA Consultation
          </div>
          <h2 id="expert-modal-title">1-on-1 Legal Advice & Form M Review</h2>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Get direct consultation from a verified RERA High Court Advocate before filing your complaint.
          </p>
        </div>

        {/* Selected Advocate Card */}
        <div className="selected-advocate-container">
          <ExpertAdvocateCard advocate={advocate} isUnlocked={isUnlocked} />
        </div>

        {isUnlocked ? (
          /* Unlocked / Post-payment state */
          <div className="unlocked-contact-box">
            <div className="unlocked-header">
              <CheckCircle2 size={24} className="text-success" />
              <div>
                <h3>Legal Consultation Unlocked!</h3>
                <p>You now have direct contact access to {advocate.name}.</p>
              </div>
            </div>

            <div className="contact-actions-grid">
              <a
                href={`tel:${advocate.fullPhone.replace(/\s+/g, '')}`}
                className="btn btn-accent btn-md"
              >
                <Phone size={16} /> Call {advocate.fullPhone}
              </a>
              <a
                href={`https://wa.me/${advocate.fullPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(advocate.name)},%20I%20need%20RERA%20legal%20guidance.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-md"
              >
                <MessageSquare size={16} /> WhatsApp Advocate
              </a>
            </div>

            <div className="callback-notice">
              <Clock size={15} />
              <span>Advocate callback scheduled within 24 hours. Keep your booking details ready.</span>
            </div>
          </div>
        ) : (
          /* Pre-payment form state */
          <form className="expert-consult-form" onSubmit={handleSubmit}>
            <div className="form-section-title">Enter Consultation Details</div>

            <div className="form-grid-2">
              <label className="field">
                <span className="field-label">Your Name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Phone Number (for Advocate Call)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Consultation Subject</span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="Form M Litigation & Legal Review">Form M Litigation & Legal Review</option>
                <option value="Builder Delay Penalty Interest Recovery">Builder Delay Penalty Interest Recovery</option>
                <option value="Possession Delay & Refund Claim">Possession Delay & Refund Claim</option>
                <option value="High Court / RERA Execution Order">High Court / RERA Execution Order</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Brief Case Summary / Notes (Optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Mention builder name, total delay period, or specific legal questions..."
              />
            </label>

            {/* Price Box */}
            <div className="consult-price-card">
              <div className="price-details">
                <span className="price-title">1-on-1 Legal Phone Consultation + Form M Review</span>
                <span className="price-amount">₹299 <span className="strike-price">₹1,499</span></span>
              </div>
              <ul className="price-features">
                <li><ShieldCheck size={14} /> Direct Unmasked Phone Contact & WhatsApp Access</li>
                <li><Calendar size={14} /> Guaranteed 20-min phone call with advocate</li>
                <li><CheckCircle2 size={14} /> Full Form M Complaint document review</li>
              </ul>
            </div>

            <button type="submit" className="btn btn-accent btn-lg w-full">
              <Lock size={16} /> Proceed to Pay ₹299 for Expert Advice
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
