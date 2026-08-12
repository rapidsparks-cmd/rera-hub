import React from 'react';
import { Briefcase, MapPin, Scale, Phone, CheckCircle, ShieldCheck } from 'lucide-react';

/**
 * ExpertAdvocateCard - Renders an expert RERA advocate profile card matching the exact user UI reference.
 */
export default function ExpertAdvocateCard({ advocate, isUnlocked = false, onConsult }) {
  const {
    name = 'P R xxxxxxxxli',
    experienceYears = 29,
    location = 'Bangalore',
    practiceArea = 'Criminal + 2 more',
    maskedPhone = '+91 6644****52',
    fullPhone = '+91 98451 66452',
    avatar = '/avatars/male_advocate.png',
    isVerified = true,
    email = '',
    maskedEmail = '',
    court = '',
  } = advocate || {};

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (onConsult) onConsult(advocate);
  };

  return (
    <div
      className={`expert-advocate-card ${isUnlocked ? 'unlocked' : ''}`}
      onClick={handleActionClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleActionClick(e)}
    >
      {/* Left: Avatar */}
      <div className="advocate-avatar-wrap">
        <img
          src={avatar}
          alt={name}
          className="advocate-avatar-img"
          onError={(e) => {
            e.target.src = '/avatars/male_advocate.png';
          }}
        />
        {isVerified && (
          <span className="verified-badge" title="Verified RERA Advocate">
            <ShieldCheck size={14} />
          </span>
        )}
      </div>

      {/* Center: Details */}
      <div className="advocate-info">
        <div className="advocate-name-row">
          <h4 className="advocate-name">{name}</h4>
          {isUnlocked && <span className="unlocked-chip"><CheckCircle size={12} /> Contact Unlocked</span>}
        </div>
        {court && (
          <div className="advocate-court-subtitle" style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '-2px', marginBottom: '8px' }}>
            {court}
          </div>
        )}

        <div className="advocate-meta-line">
          <Briefcase size={16} className="meta-icon icon-briefcase" />
          <span>{experienceYears} years of Experience</span>
        </div>

        <div className="advocate-meta-line">
          <MapPin size={16} className="meta-icon icon-mappin" />
          <span>{location}</span>
        </div>

        <div className="advocate-meta-line">
          <Scale size={16} className="meta-icon icon-scale" />
          <span>Practice area & skills: {practiceArea}</span>
        </div>

        {(email || maskedEmail) && (
          <div className="advocate-meta-line" style={{ marginTop: '2px' }}>
            <span style={{ marginRight: '6px', fontSize: '0.85rem' }}>✉️</span>
            <span style={{ fontSize: '0.85rem' }}>Email: {isUnlocked ? email : maskedEmail}</span>
          </div>
        )}
      </div>

      {/* Right: Phone / Action Button */}
      <div className="advocate-action-wrap">
        <button
          type="button"
          className="btn-phone-connect"
          onClick={handleActionClick}
        >
          <Phone size={15} />
          <span>{isUnlocked ? fullPhone : maskedPhone}</span>
        </button>
      </div>
    </div>
  );
}
