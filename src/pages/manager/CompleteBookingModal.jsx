// src/components/manager/CompleteBookingModal.jsx
import React, { useState } from 'react';
import { X, AlertCircle, DollarSign, FileText, CheckCircle } from 'lucide-react';
import '../../styles/CompleteBookingModal.css';

const CompleteBookingModal = ({ booking, onClose, onComplete }) => {
  const [hasDamage, setHasDamage] = useState(false);
  const [damageReason, setDamageReason] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (hasDamage) {
      if (!damageReason.trim()) {
        newErrors.damageReason = 'Damage reason is required when applying penalty';
      }
      if (!penaltyAmount || parseFloat(penaltyAmount) <= 0) {
        newErrors.penaltyAmount = 'Penalty amount must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onComplete({
        bookingId: booking._id,
        hasDamage,
        damageReason: hasDamage ? damageReason : null,
        penaltyAmount: hasDamage ? parseFloat(penaltyAmount) : 0
      });
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="complete-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="complete-modal-header">
          <div>
            <h2>Complete Booking</h2>
            <p className="booking-ref">Booking ID: {booking._id.slice(-8).toUpperCase()}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="complete-modal-body">
          {/* Booking Summary */}
          <div className="booking-summary">
            <div className="summary-item">
              <span className="summary-label">Customer</span>
              <span className="summary-value">{booking.customerName || booking.customer?.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Vehicle</span>
              <span className="summary-value">{booking.vehicleName}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Pickup Date</span>
              <span className="summary-value">
                {new Date(booking.pickupDate).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Damage Question */}
            <div className="form-section">
              <label className="damage-label">
                <input
                  type="checkbox"
                  checked={hasDamage}
                  onChange={(e) => {
                    setHasDamage(e.target.checked);
                    if (!e.target.checked) {
                      setDamageReason('');
                      setPenaltyAmount('');
                      setErrors({});
                    }
                  }}
                />
                <span>Vehicle has damage that requires penalty</span>
              </label>
            </div>

            {/* Damage Details (conditional) */}
            {hasDamage && (
              <div className="damage-details">
                <div className="alert-box">
                  <AlertCircle size={20} />
                  <span>Customer will be notified via email and must pay the penalty before completion.</span>
                </div>

                {/* Damage Reason */}
                <div className="form-group">
                  <label>
                    <FileText size={16} />
                    Damage Reason *
                  </label>
                  <textarea
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                    placeholder="Describe the damage in detail..."
                    rows={4}
                    className={errors.damageReason ? 'error' : ''}
                  />
                  {errors.damageReason && (
                    <span className="error-message">{errors.damageReason}</span>
                  )}
                </div>

                {/* Penalty Amount */}
                <div className="form-group">
                  <label>
                    <DollarSign size={16} />
                    Penalty Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    placeholder="Enter penalty amount"
                    min="0"
                    step="0.01"
                    className={errors.penaltyAmount ? 'error' : ''}
                  />
                  {errors.penaltyAmount && (
                    <span className="error-message">{errors.penaltyAmount}</span>
                  )}
                </div>

                {/* Penalty Summary */}
                {penaltyAmount && parseFloat(penaltyAmount) > 0 && (
                  <div className="penalty-summary">
                    <div className="penalty-row">
                      <span>Original Amount</span>
                      <span>₹{booking.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="penalty-row penalty-fee">
                      <span>Penalty Fee</span>
                      <span>+ ₹{parseFloat(penaltyAmount).toLocaleString()}</span>
                    </div>
                    <div className="penalty-row total">
                      <span>Total Amount</span>
                      <span>₹{(booking.totalAmount + parseFloat(penaltyAmount)).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Damage Info */}
            {!hasDamage && (
              <div className="success-box">
                <CheckCircle size={20} />
                <span>Vehicle is in good condition. Booking will be completed immediately.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-confirm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    {hasDamage ? 'Apply Penalty' : 'Complete Booking'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteBookingModal;