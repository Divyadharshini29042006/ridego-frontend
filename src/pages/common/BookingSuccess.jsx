// frontend/src/pages/common/BookingSuccess.jsx

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  FaCheckCircle,
  FaHome,
  FaFileAlt,
  FaCar,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCreditCard,
  FaDownload,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaUser,
  FaPlane,
  FaArrowRight,
  FaStar
} from 'react-icons/fa';
import '../../styles/BookingSuccess.css';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, bookingData, paymentId } = location.state || {};

  useEffect(() => {
    if (!bookingId || !bookingData) {
      navigate('/');
    }
  }, [bookingId, bookingData, navigate]);

  if (!bookingId || !bookingData) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();

    // Set up fonts and colors
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);

    // Header
    doc.text('RIDEGO TRAVELS', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('BOOKING RECEIPT', 105, 30, { align: 'center' });

    // Booking details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    let yPosition = 50;

    doc.text(`Booking Reference: ${bookingId}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Payment ID: ${paymentId}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition);
    yPosition += 20;

    // Trip Details
    doc.setFont('helvetica', 'bold');
    doc.text('TRIP DETAILS', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');

    doc.text(`Trip Type: ${bookingData.tripType}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Number of Vehicles: ${bookingData.numberOfVehicles}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Pickup Location: ${bookingData.commonPickupAddress || bookingData.pickupCity}`, 20, yPosition);
    yPosition += 8;

    if (bookingData.tripTypeId !== 'hourly') {
      doc.text(`Drop Location: ${bookingData.dropCity || bookingData.pickupCity}`, 20, yPosition);
      yPosition += 8;
    }

    doc.text(`Pickup Date: ${formatDate(bookingData.vehicles?.[0]?.pickupDate)}`, 20, yPosition);
    yPosition += 8;

    if (bookingData.tripTypeId === 'outstation' && bookingData.vehicles?.[0]?.returnDate) {
      doc.text(`Return Date: ${formatDate(bookingData.vehicles[0].returnDate)}`, 20, yPosition);
      yPosition += 8;
    }

    if (bookingData.tripTypeId === 'hourly' && bookingData.vehicles?.[0]?.hours) {
      doc.text(`Duration: ${bookingData.vehicles[0].hours} hour(s)`, 20, yPosition);
      yPosition += 8;
    }

    yPosition += 10;

    // Vehicle Details
    doc.setFont('helvetica', 'bold');
    doc.text('VEHICLE DETAILS', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');

    bookingData.vehicles?.forEach((vehicle, index) => {
      doc.text(`Vehicle #${index + 1}: ${vehicle.vehicleName}`, 20, yPosition);
      yPosition += 8;
      doc.text(`  Type: ${vehicle.vehicleType}`, 20, yPosition);
      yPosition += 8;
      doc.text(`  Driver: ${vehicle.needsDriver ? `Yes (${vehicle.driverGender})` : 'Self-Drive'}`, 20, yPosition);
      yPosition += 8;
      if (vehicle.tripPurpose) {
        doc.text(`  Purpose: ${vehicle.tripPurpose}`, 20, yPosition);
        yPosition += 8;
      }
      if (vehicle.flightOrTrain) {
        doc.text(`  Flight/Train: ${vehicle.flightOrTrain}`, 20, yPosition);
        yPosition += 8;
      }
      yPosition += 5;
    });

    yPosition += 10;

    // Payment Summary
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');

    bookingData.vehicleFares?.forEach((vehicleFare, index) => {
      doc.text(`Vehicle #${index + 1}: ₹${vehicleFare.fare}`, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PAID: ₹${bookingData.totalFare}`, 20, yPosition);
    yPosition += 20;

    // Contact Support
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT SUPPORT', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Email: support@ridego.com', 20, yPosition);
    yPosition += 8;
    doc.text('Phone: +91 1234567890', 20, yPosition);
    yPosition += 20;

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing RideGo Travels!', 105, yPosition, { align: 'center' });
    yPosition += 8;
    doc.text('Safe journey ahead!', 105, yPosition, { align: 'center' });

    // Save the PDF
    doc.save(`RideGo_Receipt_${bookingId}.pdf`);
  };

  return (
    <div className="modern-booking-container">
      <div className="modern-success-content">
        {/* Success Header */}
        <div className="modern-header">
          <div className="check-icon-wrapper">
            <FaCheckCircle className="check-icon" />
          </div>
          <h1 className="modern-title">Booking Confirmed</h1>
          <p className="modern-subtitle">
            Your journey is secured. We'll take care of the rest.
          </p>
          <div className="confirmation-badge">
            <FaStar className="badge-icon" />
            <span>Confirmation sent to your email</span>
          </div>
        </div>

        {/* Booking ID Highlight */}
        <div className="booking-id-card">
          <div className="booking-id-content">
            <div className="booking-id-left">
              <div className="icon-box">
                <FaFileAlt />
              </div>
              <div className="booking-id-info">
                <p className="booking-id-label">Booking Reference</p>
                <p className="booking-id-number">{bookingId}</p>
              </div>
            </div>
            <button className="download-btn" onClick={handleDownloadReceipt}>
              <FaDownload />
              Download Receipt
            </button>
          </div>
        </div>

        <div className="modern-grid">
          {/* Main Details */}
          <div className="modern-grid-main">
            {/* Trip Details Card */}
            <div className="modern-card">
              <div className="modern-card-header">
                <h2>
                  <FaCar className="header-icon" />
                  Trip Details
                </h2>
              </div>
              <div className="modern-card-body">
                <div className="detail-item">
                  <div className="detail-item-left">
                    <FaCar className="detail-item-icon" />
                    <span className="detail-item-label">Trip Type</span>
                  </div>
                  <span className="detail-item-value">{bookingData.tripType}</span>
                </div>

                <div className="detail-item">
                  <div className="detail-item-left">
                    <FaCar className="detail-item-icon" />
                    <span className="detail-item-label">Number of Vehicles</span>
                  </div>
                  <span className="detail-item-value">{bookingData.numberOfVehicles}</span>
                </div>

                <div className="detail-item">
                  <div className="detail-item-left">
                    <FaMapMarkerAlt className="detail-item-icon" />
                    <span className="detail-item-label">Pickup Location</span>
                  </div>
                  <span className="detail-item-value">
                    {bookingData.commonPickupAddress || bookingData.pickupCity}
                  </span>
                </div>

                {bookingData.tripTypeId !== 'hourly' && (
                  <div className="detail-item">
                    <div className="detail-item-left">
                      <FaMapMarkerAlt className="detail-item-icon" />
                      <span className="detail-item-label">Drop Location</span>
                    </div>
                    <span className="detail-item-value">
                      {bookingData.dropCity || bookingData.pickupCity}
                    </span>
                  </div>
                )}

                <div className="detail-item">
                  <div className="detail-item-left">
                    <FaCalendarAlt className="detail-item-icon" />
                    <span className="detail-item-label">Pickup Date</span>
                  </div>
                  <span className="detail-item-value">
                    {formatDate(bookingData.vehicles?.[0]?.pickupDate)}
                  </span>
                </div>

                {bookingData.tripTypeId === 'outstation' && bookingData.vehicles?.[0]?.returnDate && (
                  <div className="detail-item">
                    <div className="detail-item-left">
                      <FaCalendarAlt className="detail-item-icon" />
                      <span className="detail-item-label">Return Date</span>
                    </div>
                    <span className="detail-item-value">
                      {formatDate(bookingData.vehicles[0].returnDate)}
                    </span>
                  </div>
                )}

                {bookingData.tripTypeId === 'hourly' && bookingData.vehicles?.[0]?.hours && (
                  <div className="detail-item">
                    <div className="detail-item-left">
                      <FaClock className="detail-item-icon" />
                      <span className="detail-item-label">Duration</span>
                    </div>
                    <span className="detail-item-value">
                      {bookingData.vehicles[0].hours} hour(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details Card */}
            <div className="modern-card">
              <div className="modern-card-header">
                <h2>
                  <FaCar className="header-icon" />
                  Vehicle Details
                </h2>
              </div>
              <div className="modern-card-body">
                {bookingData.vehicles?.map((vehicle, index) => (
                  <div key={index} className="vehicle-item">
                    <div className="vehicle-item-header">
                      <h3>Vehicle #{index + 1} - {vehicle.vehicleName}</h3>
                      <span className="vehicle-badge">{vehicle.vehicleType}</span>
                    </div>
                    <div className="vehicle-item-details">
                      <div className="vehicle-detail">
                        <FaUser className="vehicle-detail-icon" />
                        <span>Driver: {vehicle.needsDriver ? `Yes (${vehicle.driverGender})` : 'Self-Drive'}</span>
                      </div>
                      {vehicle.tripPurpose && (
                        <div className="vehicle-detail">
                          <FaStar className="vehicle-detail-icon" />
                          <span>Purpose: {vehicle.tripPurpose}</span>
                        </div>
                      )}
                      {vehicle.flightOrTrain && (
                        <div className="vehicle-detail">
                          <FaPlane className="vehicle-detail-icon" />
                          <span>Flight/Train: {vehicle.flightOrTrain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="modern-card next-steps-card">
              <div className="modern-card-header">
                <h2>
                  <FaArrowRight className="header-icon" />
                  What's Next?
                </h2>
              </div>
              <div className="modern-card-body">
                <ul className="steps-list">
                  <li>
                    <span className="step-icon">✓</span>
                    <span>A confirmation email has been sent to your registered email address</span>
                  </li>
                  <li>
                    <span className="step-icon">✓</span>
                    <span>Our team will contact you within 24 hours to confirm pickup details</span>
                  </li>
                  <li>
                    <span className="step-icon">✓</span>
                    <span>Please keep your booking ID handy for reference</span>
                  </li>
                  <li>
                    <span className="step-icon">✓</span>
                    <span>Arrive 15 minutes before your scheduled pickup time</span>
                  </li>
                  <li>
                    <span className="step-icon">✓</span>
                    <span>Carry a valid driving license (for self-drive bookings)</span>
                  </li>
                  <li>
                    <span className="step-icon">✓</span>
                    <span>Security deposit may be collected at the time of pickup</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="modern-grid-sidebar">
            {/* Payment Summary Card */}
            <div className="modern-card payment-card">
              <div className="modern-card-header">
                <h2>
                  <FaCreditCard className="header-icon" />
                  Payment Summary
                </h2>
              </div>
              <div className="modern-card-body">
                <div className="payment-item">
                  <span className="payment-label">Payment ID</span>
                  <span className="payment-id">{paymentId}</span>
                </div>
                <div className="payment-divider"></div>
                {bookingData.vehicleFares?.map((vehicleFare, index) => (
                  <div key={index} className="payment-item">
                    <span className="payment-label">Vehicle #{index + 1}</span>
                    <span className="payment-value">₹{vehicleFare.fare}</span>
                  </div>
                ))}
                <div className="payment-divider"></div>
                <div className="payment-total">
                  <span className="payment-total-label">Total Paid</span>
                  <span className="payment-total-value">₹{bookingData.totalFare}</span>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="modern-card support-card">
              <div className="modern-card-header">
                <h2>Need Help?</h2>
              </div>
              <div className="modern-card-body">
                <div className="support-item">
                  <FaEnvelope className="support-icon" />
                  <div className="support-info">
                    <p className="support-label">Email</p>
                    <p className="support-value">support@ridego.com</p>
                  </div>
                </div>
                <div className="support-item">
                  <FaPhone className="support-icon" />
                  <div className="support-info">
                    <p className="support-label">Phone</p>
                    <p className="support-value">+91 1234567890</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modern-actions">
          <button
            onClick={() => navigate('/my-bookings')}
            className="modern-btn modern-btn-secondary"
          >
            <FaFileAlt />
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="modern-btn modern-btn-primary"
          >
            <FaHome />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;