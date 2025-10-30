import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCar,
  FaUser,
  FaEdit,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMotorcycle,
  FaArrowLeft,
  FaShieldAlt,
  FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { getVehicleImageUrl } from '../../utils/imageUtils';
import axios from 'axios';
import styles from '../../styles/ConfirmBooking.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const ConfirmBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const bookingContext = useBooking();
  
  const routeBookingData = location.state?.bookingData;
  const bookingData = routeBookingData || bookingContext.getBookingSummary();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!user) {
      console.warn('User not logged in, redirecting to login');
      navigate('/login', {
        state: {
          from: '/confirm-booking',
          message: 'Please login to complete your booking'
        }
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!bookingData.vehicles || bookingData.vehicles.length === 0) {
      console.warn('No booking data found, redirecting to home');
      navigate('/');
    }
  }, [bookingData, navigate]);

  if (!bookingData || !user) {
    return null;
  }

  const handleEditBooking = () => {
    navigate('/booking');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      
      if (existingScript) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleConfirmAndPay = async () => {
    setProcessingPayment(true);
    setError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.');
      }

      const token = localStorage.getItem('token');
      const orderResponse = await axios.post(
        `${API_BASE_URL}/payments/create-order`,
        {
          amount: bookingData.totalFare,
          currency: 'INR',
          receipt: `booking_${Date.now()}`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const { orderId, amount, currency } = orderResponse.data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'RideGo',
        description: `Booking for ${bookingData.numberOfVehicles} vehicle(s) - ${bookingData.tripType}`,
        order_id: orderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#4299e1'
        },
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!verifyResponse.data.success) {
              throw new Error(verifyResponse.data.message || 'Payment verification failed');
            }

            // Validate booking data before creating payload
            if (!bookingData.vehicles || !Array.isArray(bookingData.vehicles) || bookingData.vehicles.length === 0) {
              throw new Error('No vehicles selected for booking');
            }

            if (!bookingData.tripTypeId) {
              throw new Error('Trip type is required');
            }

            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Payment information is incomplete');
            }

            // Validate each vehicle
            bookingData.vehicles.forEach((vehicle, index) => {
              if (!vehicle.vehicleId) {
                throw new Error(`Vehicle ${index + 1}: Vehicle ID is required`);
              }
              if (!vehicle.pickupDate) {
                throw new Error(`Vehicle ${index + 1}: Pickup date is required`);
              }
              const pickupDate = new Date(vehicle.pickupDate);
              if (isNaN(pickupDate.getTime())) {
                throw new Error(`Vehicle ${index + 1}: Invalid pickup date format`);
              }
              if (pickupDate < new Date()) {
                throw new Error(`Vehicle ${index + 1}: Pickup date cannot be in the past`);
              }
            });

            const bookingPayload = {
              vehicles: bookingData.vehicles.map((vehicle, index) => {
                const pickupDate = new Date(vehicle.pickupDate);
                const returnDate = vehicle.returnDate
                  ? new Date(vehicle.returnDate)
                  : new Date(vehicle.pickupDate);

                return {
                  vehicleId: vehicle.vehicleId,
                  vehicleName: vehicle.vehicleName || 'Unknown Vehicle',
                  vehicleType: vehicle.vehicleType || 'Car',
                  vehicleImage: vehicle.vehicleImage || null,
                  pickupLocation: vehicle.pickupLocation || bookingData.commonPickupAddress || bookingData.pickupCity,
                  dropLocation: vehicle.dropLocation || bookingData.dropCity || bookingData.pickupCity,
                  pickupDate: pickupDate.toISOString(),
                  returnDate: returnDate.toISOString(),
                  hours: vehicle.hours || (bookingData.tripTypeId === 'hourly' ? 1 : null),
                  needsDriver: Boolean(vehicle.needsDriver),
                  driverGender: vehicle.driverGender || 'Any',
                  tripPurpose: vehicle.tripPurpose || null
                };
              }),

              vehicleFares: bookingData.vehicleFares.map((fare, index) => ({
                vehicleId: index + 1,
                fare: fare.fare || 0,
                days: fare.days || 1,
                breakdown: fare.breakdown || {}
              })),

              tripType: bookingData.tripType,
              tripTypeId: bookingData.tripTypeId,
              totalFare: Number(bookingData.totalFare) || 0,
              numberOfVehicles: Number(bookingData.numberOfVehicles) || 1,

              pickupFromOurLocation: Boolean(bookingData.pickupFromOurLocation),
              commonPickupAddress: bookingData.commonPickupAddress || bookingData.pickupCity || '',
              pickupCity: bookingData.pickupCity || '',
              dropCity: bookingData.dropCity || bookingData.pickupCity || '',

              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              paymentStatus: 'completed',

              customerId: user.id || user._id,
              customerName: user.name,
              customerEmail: user.email,

              // Add idempotency key to prevent duplicate bookings
              idempotencyKey: `booking_${Date.now()}_${Math.random().toString(36).slice(2)}`
            };

            console.log('📤 Sending booking payload:', JSON.stringify(bookingPayload, null, 2));

            const bookingResponse = await axios.post(
              `${API_BASE_URL}/bookings/create`,
              bookingPayload,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (bookingResponse.data.success) {
              bookingContext.clearBooking();

              navigate('/booking-success', {
                state: {
                  bookingId: bookingResponse.data.bookingId,
                  bookingData: bookingPayload,
                  paymentId: response.razorpay_payment_id
                }
              });
            } else {
              throw new Error(bookingResponse.data.message || 'Booking creation failed');
            }
          } catch (err) {
            console.error('❌ Error creating booking:', err);

            if (err.response) {
              console.error('Response data:', err.response.data);
              console.error('Response status:', err.response.status);
              console.error('Response headers:', err.response.headers);
            }

            const errorMessage = err.response?.data?.message
              || err.message
              || 'Booking creation failed';

            setError(`Payment successful (ID: ${response.razorpay_payment_id}) but booking failed. Our team will contact you within 24 hours. Error: ${errorMessage}`);

            // Flag payment for review when booking fails
            try {
              await axios.post(`${API_BASE_URL}/payments/flag-for-review`, {
                paymentId: response.razorpay_payment_id,
                error: errorMessage
              }, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              console.log('✅ Payment flagged for review due to booking failure');
            } catch (flagError) {
              console.error('❌ Failed to flag payment for review:', flagError);
            }

            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            setError('Payment cancelled. You can try again when ready.');
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setProcessingPayment(false);
      });

      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };



  return (
    <div className={styles.confirmBookingContainer}>
      <div className={styles.backButtonContainer}>
        <button className={styles.backButton} onClick={handleEditBooking} disabled={processingPayment}>
          <FaArrowLeft className={styles.backIcon} />
          Back to booking details
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {processingPayment && (
        <div className={styles.infoBanner}>
          <FaSpinner className={styles.spinner} />
          <span>Processing your payment... Please do not close this window.</span>
        </div>
      )}

      <div className={styles.confirmBookingContent}>
        {/* Left Section - Booking Summary */}
        <div className={styles.leftSection}>
          <div className={styles.sectionHeader}>
            <h1 className={styles.pageTitle}>Confirm Your Booking</h1>
            <p className={styles.pageSubtitle}>Review your booking details before proceeding to payment</p>
          </div>

          {/* Trip Type Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <FaCar className={styles.titleIcon} />
                Trip Information
              </h3>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Trip Type:</span>
                <span className={styles.infoValue}>{bookingData.tripType}</span>
              </div>
              {bookingData.tripTypeId === 'hourly' && bookingData.vehicles?.[0]?.hours && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Duration:</span>
                  <span className={styles.infoValue}>{bookingData.vehicles[0].hours} hour(s)</span>
                </div>
              )}
              {bookingData.tripTypeId === 'hourly' && bookingData.vehicles?.[0]?.tripPurpose && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Purpose:</span>
                  <span className={styles.infoValue}>{bookingData.vehicles[0].tripPurpose}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location Details Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <FaMapMarkerAlt className={styles.titleIcon} />
                Location Details
              </h3>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Pickup Location:</span>
                <span className={styles.infoValue}>{bookingData.commonPickupAddress || bookingData.pickupCity}</span>
              </div>
              {bookingData.tripTypeId !== 'hourly' && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Drop Location:</span>
                  <span className={styles.infoValue}>
                    {bookingData.vehicles?.[0]?.dropLocation || bookingData.dropCity || bookingData.pickupCity}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <FaCalendarAlt className={styles.titleIcon} />
                Date & Time
              </h3>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Pickup:</span>
                <span className={styles.infoValue}>
                  {formatDate(bookingData.vehicles?.[0]?.pickupDate)} at {formatTime(bookingData.vehicles?.[0]?.pickupDate)}
                </span>
              </div>
              {bookingData.tripTypeId === 'outstation' && bookingData.vehicles?.[0]?.returnDate && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Return:</span>
                  <span className={styles.infoValue}>
                    {formatDate(bookingData.vehicles[0].returnDate)} at {formatTime(bookingData.vehicles[0].returnDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicles Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <FaCar className={styles.titleIcon} />
                Selected Vehicles ({bookingData.numberOfVehicles})
              </h3>
            </div>
            <div className={styles.cardContent}>
              {bookingData.vehicles?.map((vehicle, index) => (
                <div key={index} className={styles.vehicleItem}>
                  <div className={styles.vehicleImageWrapper}>
                    {vehicle.vehicleImage ? (
                      <img
                        src={getVehicleImageUrl(vehicle.vehicleImage)}
                        alt={vehicle.vehicleName}
                        className={styles.vehicleThumbnail}
                        onError={(e) => {
                          if (!e.target.dataset.errorHandled) {
                            e.target.dataset.errorHandled = 'true';
                            e.target.src = '/default-car.jpg';
                          }
                        }}
                      />
                    ) : (
                      <div className={styles.vehiclePlaceholder}>
                        {vehicle.vehicleType === 'Bike' ? <FaMotorcycle /> : <FaCar />}
                      </div>
                    )}
                  </div>
                  <div className={styles.vehicleDetails}>
                    <h4 className={styles.vehicleName}>
                      {vehicle.vehicleType === 'Bike' ? <FaMotorcycle /> : <FaCar />}
                      Vehicle #{index + 1} - {vehicle.vehicleName}
                    </h4>
                    <p className={styles.vehicleType}>{vehicle.vehicleType}</p>
                    <div className={styles.vehicleDriverInfo}>
                      <FaUser className={styles.driverIcon} />
                      <span>
                        Driver: {vehicle.needsDriver ? `Yes (${vehicle.driverGender})` : 'Self-Drive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Fare Summary & Actions */}
        <div className={styles.rightSection}>
          {/* Fare Breakdown Card */}
          <div className={`${styles.summaryCard} ${styles.stickyCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Fare Summary</h3>
            </div>
            <div className={styles.cardContent}>
              {bookingData.vehicleFares?.map((vehicleFare, index) => (
                <div key={index} className={styles.fareVehicleSection}>
                  <div className={styles.fareVehicleHeader}>
                    <span className={styles.fareVehicleName}>Vehicle #{index + 1}</span>
                    <span className={styles.fareVehicleAmount}>₹{vehicleFare.fare}</span>
                  </div>
                  {vehicleFare.breakdown && (
                    <div className={styles.fareBreakdown}>
                      {vehicleFare.days && (
                        <div className={styles.fareRow}>
                          <span>Duration:</span>
                          <span>{vehicleFare.days} day(s)</span>
                        </div>
                      )}
                      <div className={styles.fareRow}>
                        <span>Vehicle Rent:</span>
                        <span>₹{vehicleFare.breakdown.vehicleRent}</span>
                      </div>
                      {vehicleFare.breakdown.distanceCharges > 0 && (
                        <div className={styles.fareRow}>
                          <span>Distance Charges:</span>
                          <span>₹{vehicleFare.breakdown.distanceCharges}</span>
                        </div>
                      )}
                      {vehicleFare.breakdown.driverCharges > 0 && (
                        <div className={styles.fareRow}>
                          <span>Driver Charges:</span>
                          <span>₹{vehicleFare.breakdown.driverCharges}</span>
                        </div>
                      )}
                      {vehicleFare.breakdown.nightCharges > 0 && (
                        <div className={styles.fareRow}>
                          <span>Night Charges:</span>
                          <span>₹{vehicleFare.breakdown.nightCharges}</span>
                        </div>
                      )}
                      <div className={styles.fareRow}>
                        <span>Platform Fee:</span>
                        <span>₹{vehicleFare.breakdown.platformFee}</span>
                      </div>
                      <div className={styles.fareRow}>
                        <span>GST (5%):</span>
                        <span>₹{Math.round(vehicleFare.breakdown.gst)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className={styles.fareDivider}></div>

              <div className={styles.totalFareRow}>
                <span className={styles.totalLabel}>Total Amount</span>
                <span className={styles.totalAmount}>₹{bookingData.totalFare}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={handleEditBooking}
              className={styles.editButton}
              disabled={processingPayment}
            >
              <FaEdit />
              Edit Booking
            </button>
            <button
              onClick={handleConfirmAndPay}
              className={styles.confirmButton}
              disabled={processingPayment || loading}
            >
              {processingPayment ? (
                <>
                  <FaSpinner className={styles.spinner} />
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Confirm & Pay ₹{bookingData.totalFare}
                </>
              )}
            </button>
          </div>

          {/* Security Info */}
          <div className={styles.securityInfo}>
            <FaShieldAlt className={styles.securityIcon} />
            <div className={styles.securityText}>
              <h4>Secure Payment</h4>
              <p>Your payment information is encrypted and secure with Razorpay</p>
            </div>
          </div>

          {/* Important Info */}
          <div className={styles.infoCard}>
            <h4 className={styles.infoTitle}>Important Information</h4>
            <ul className={styles.infoList}>
              <li>Free cancellation up to 24 hours before pickup</li>
              <li>Valid driving license required for self-drive</li>
              <li>Fuel charges not included in the fare</li>
              <li>Toll and parking charges are extra</li>
              <li>Security deposit may be collected at pickup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBooking;