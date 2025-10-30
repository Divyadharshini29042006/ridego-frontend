// src/pages/admin/AdminBookings

import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Filter, Search, BarChart3, Loader2 } from 'lucide-react';

function AdminBookings() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    managerId: ''
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:5000/api/admin/bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // Add query parameters for filters
        ...(Object.keys(filters).some(key => filters[key]) && {
          body: JSON.stringify(filters)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBookings(data.bookings || data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
        }

        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%);
          padding-top: 120px;
        }

        .header {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          position: sticky;
          top: 100px;
          z-index: 10;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .header-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.025em;
        }

        .header-subtitle {
          margin: 0;
          font-size: 14px;
          color: #2e3034ff;
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.loading {
          background: #f59e0b;
        }

        .status-dot.error {
          background: #ef4444;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .main-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px;
        }

        .filters-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(15, 15, 17, 0.5);
          margin-bottom: 32px;
          overflow: hidden;
        }

        .filters-header {
          background: linear-gradient(135deg, #f9fafb, #eff6ff);
          padding: 24px 32px;
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filters-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .filters-content {
          padding: 32px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .form-label span {
          color: black;
        }

        .form-label svg {
          width: 16px;
          height: 16px;
          color: #2563eb;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid black;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          color: black;
          background: white;
          transition: all 0.2s ease;
        }

        input[name="location"] {
          border: 1px solid black !important;
          border-radius: 12px;
        }

        input[name="managerId"],
        input[name="endDate"],
        input[name="startDate"] {
          border: 1px solid black !important;
          border-radius: 12px;
        }

        .form-input:focus {
          outline: 2px solid rgba(37, 99, 235, 0.2);
          border-color: #2563eb;
        }

        .form-input::placeholder {
          color: #000000ff;
        }

        .filters-actions {
          display: flex;
          justify-content: flex-end;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
          transform: translateY(-1px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary svg {
          width: 16px;
          height: 16px;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .results-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(229, 231, 235, 0.5);
          overflow: hidden;
        }

        .results-header {
          background: linear-gradient(135deg, #f7fbffff, #eff6ff);
          padding: 24px 32px;
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .results-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .results-meta {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .results-content {
          padding: 32px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .booking-card {
          position: relative;
          background: linear-gradient(135deg, #f3efefff, rgba(249, 250, 251, 0.5));
          border: 1px solid rgba(229, 231, 235, 0.5);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .booking-card:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .booking-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .booking-title-section {
          flex: 1;
        }

        .booking-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .booking-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          transition: color 0.2s ease;
        }

        .booking-card:hover .booking-title {
          color: #2563eb;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
          border: 1px solid;
        }

        .status-confirmed {
          background: #d1fae5;
          color: #065f46;
          border-color: #a7f3d0;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fca5a5;
        }

        .status-default {
          background: #f3f4f6;
          color: #374151;
          border-color: #d1d5db;
        }

        .booking-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          font-size: 14px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-item svg {
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }

        .detail-text {
          font-weight: 500;
          color: #111827;
        }

        .detail-text.secondary {
          color: #6b7280;
        }

        .detail-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
        }

        .detail-dot.green {
          background: #10b981;
        }

        .booking-meta {
          margin-left: 24px;
          text-align: right;
        }

        .booking-time {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .booking-id {
          font-size: 12px;
          color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 64px 0;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #dbeafe, #e0e7ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .empty-icon svg {
          width: 32px;
          height: 32px;
          color: #2563eb;
        }

        .empty-title {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .empty-description {
          margin: 0;
          color: #6b7280;
          font-weight: 500;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 0;
          gap: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding-top: 100px;
          }
          
          .header {
            top: 80px;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .main-content {
            padding: 16px;
          }
          
          .filters-content {
            padding: 16px;
          }
          
          .results-content {
            padding: 16px;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .booking-details {
            grid-template-columns: 1fr;
          }
          
          .booking-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .booking-meta {
            margin-left: 0;
            text-align: left;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon">
                <BarChart3 />
              </div>
              <div>
                <h1 className="header-title">Bookings Dashboard</h1>
                <p className="header-subtitle">Manage and filter all venue bookings</p>
              </div>
            </div>
            <div className="header-right">
              <div className={`status-dot ${loading ? 'loading' : error ? 'error' : ''}`}></div>
              <span>{loading ? 'Loading...' : error ? 'Error' : 'Live Data'}</span>
            </div>
          </div>
        </div>

        <div className="main-content">
          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-header">
              <Filter />
              <h2 className="filters-title">Advanced Filters</h2>
            </div>
            
            <div className="filters-content">
              <div className="filters-grid">
                <div className="form-group">
                  <label className="form-label">
                    <Calendar />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Search locations..."
                    value={filters.location}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <User />
                    <span>Manager ID</span>
                  </label>
                  <input
                    type="text"
                    name="managerId"
                    placeholder="Manager ID..."
                    value={filters.managerId}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="filters-actions">
                <button onClick={fetchBookings} className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="loading-spinner" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search />
                      <span>Apply Filters</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bookings Results */}
          <div className="results-section">
            <div className="results-header">
              <h2 className="results-title">
                Booking Results ({bookings.length} found)
              </h2>
              <div className="results-meta">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="results-content">
              {error && (
                <div className="error-message">
                  Error loading bookings: {error}
                </div>
              )}

              {loading ? (
                <div className="loading-state">
                  <Loader2 className="loading-spinner" />
                  <span>Loading bookings...</span>
                </div>
              ) : bookings.length > 0 ? (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <div key={booking._id || booking.id} className="booking-card">
                      <div className="booking-header">
                        <div className="booking-title-section">
                          <div className="booking-title-row">
                            <h3 className="booking-title">{booking.location || 'Unknown Location'}</h3>
                            <span className={`status-badge ${getStatusClass(booking.status)}`}>
                              {booking.status || 'Unknown'}
                            </span>
                          </div>
                          
                          <div className="booking-details">
                            <div className="detail-item">
                              <Calendar />
                              <span className="detail-text">
                                {formatDate(booking.date)}
                              </span>
                            </div>
                            
                            <div className="detail-item">
                              <User />
                              <span className="detail-text secondary">
                                {booking.manager?.name || booking.managerName || 'Unassigned'}
                              </span>
                            </div>
                            
                            {booking.duration && (
                              <div className="detail-item">
                                <div className="detail-dot"></div>
                                <span className="detail-text secondary">
                                  {booking.duration}
                                </span>
                              </div>
                            )}
                            
                            {booking.attendees && (
                              <div className="detail-item">
                                <div className="detail-dot green"></div>
                                <span className="detail-text secondary">
                                  {booking.attendees} attendees
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="booking-meta">
                          <div className="booking-time">
                            {formatTime(booking.date)}
                          </div>
                          <div className="booking-id">ID: {booking._id || booking.id}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Search />
                  </div>
                  <h3 className="empty-title">No bookings found</h3>
                  <p className="empty-description">
                    {error ? 'Please check your connection and try again' : 'Try adjusting your filters to see more results'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminBookings;