import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, User, Car, Navigation, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import styles from '../../styles/ManageBookings.module.css';

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      const bookingData = data.bookings || data;
      setBookings(bookingData);
      setFilteredBookings(bookingData);
    } catch (err) {
      console.error('Error fetching bookings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating status');
      }

      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
      );
      setFilteredBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Customer', 'Vehicle', 'Driver', 'Pickup', 'Drop', 'Date', 'Status'];
    const csvData = filteredBookings.map(b => [
      b._id.slice(-6),
      b.customer?.name || '—',
      b.vehicle?.vehicleModel || '—',
      b.driver?.name || '—',
      b.pickupLocation,
      b.dropLocation,
      b.pickupDate ? new Date(b.pickupDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '—',
      b.status
    ]);
    const csvContent = [headers, ...csvData].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'bookings.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, dateFrom, dateTo, bookings]);

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vehicle?.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.dropLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(b =>
        new Date(b.pickupDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(b =>
        new Date(b.pickupDate) <= new Date(dateTo + 'T23:59:59')
      );
    }

    setFilteredBookings(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="status-icon" size={16} />;
      case 'cancelled':
        return <XCircle className="status-icon" size={16} />;
      case 'confirmed':
        return <CheckCircle className="status-icon" size={16} />;
      case 'pending':
        return <Clock className="status-icon" size={16} />;
      case 'ongoing':
        return <RefreshCw className="status-icon" size={16} />;
      case 'waiting to pay penalty':
        return <AlertCircle className="status-icon" size={16} />;
      default:
        return <AlertCircle className="status-icon" size={16} />;
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['pending', 'confirmed', 'ongoing', 'Waiting to pay penalty', 'completed', 'cancelled'];
    return allStatuses;
  };

  const statsCounts = useMemo(() => {
    const counts = {
      pending: 0,
      confirmed: 0,
      ongoing: 0,
      completed: 0
    };

    bookings.forEach(booking => {
      // Normalize status to lowercase and trim
      const status = booking.status?.toLowerCase().trim();

      // Handle all possible status values
      if (status === 'pending' ||
          status === 'pending assignment' ||
          status === 'need driver') {
        counts.pending++;
      }
      else if (status === 'confirmed') {
        counts.confirmed++;
      }
      else if (status === 'driver assigned' ||
               status === 'in progress' ||
               status === 'ongoing') {
        counts.ongoing++;
      }
      else if (status === 'completed' ||
               status === 'waiting to pay penalty') {
        counts.completed++;
      }
      // 'cancelled' bookings are not counted in any category
    });

    return counts;
  }, [bookings]);

  const pendingCount = statsCounts.pending;
  const confirmedCount = statsCounts.confirmed;
  const ongoingCount = statsCounts.ongoing;
  const completedCount = statsCounts.completed;

  return (
    <div className={styles.bookingsContainer}>
      <div className={styles.bookingsHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Booking Management</h1>
          <p className={styles.pageSubtitle}>Track and manage all booking requests</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.refreshBtn} onClick={fetchBookings}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className={`${styles.refreshBtn} ${styles.exportBtn}`} onClick={exportToCSV}>
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.pending}`}>
          <div className={`${styles.statIcon} ${styles.pending}`}>
            <Clock size={28} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Pending</p>
            <p className={styles.statValue}>{pendingCount}</p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.confirmed}`}>
          <div className={`${styles.statIcon} ${styles.confirmed}`}>
            <CheckCircle size={28} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Confirmed</p>
            <p className={styles.statValue}>{confirmedCount}</p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.ongoing}`}>
          <div className={`${styles.statIcon} ${styles.ongoing}`}>
            <RefreshCw size={28} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Ongoing</p>
            <p className={styles.statValue}>{ongoingCount}</p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.completed}`}>
          <div className={`${styles.statIcon} ${styles.completed}`}>
            <CheckCircle size={28} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Completed</p>
            <p className={styles.statValue}>{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search by customer, vehicle, driver, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <button
          className={styles.filterToggleBtn}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Calendar size={16} />
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Calendar size={16} />
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <AlertCircle size={16} />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="ongoing">Ongoing</option>
              <option value="Waiting to pay penalty">Waiting to pay penalty</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button className={styles.resetBtn} onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className={styles.emptyState}>
            <Car size={56} />
            <p>No bookings found</p>
            <span>Try adjusting your filters</span>
          </div>
        ) : (
          <>
            <table className={styles.bookingsTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Pickup</th>
                  <th>Drop</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((b) => (
                  <tr key={b._id}>
                    <td className={styles.idCell}>{b._id.slice(-6)}</td>
                    <td className={styles.customerCell}>{b.customer?.name || '—'}</td>
                    <td className={styles.vehicleCell}>{b.vehicle?.vehicleModel || '—'}</td>
                    <td className={styles.driverCell}>{b.driver?.name || '—'}</td>
                    <td>
                      <div className={styles.locationCell}>
                        <MapPin size={14} style={{ flexShrink: 0 }} />
                        <span>{b.pickupLocation}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.locationCell}>
                        <Navigation size={14} style={{ flexShrink: 0 }} />
                        <span>{b.dropLocation}</span>
                      </div>
                    </td>
                    <td className={styles.dateCell}>
                      {b.pickupDate ? new Date(b.pickupDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '—'}
                    </td>
                    <td className={styles.statusCell}>
                      <div className={styles.statusWrapper}>
                        {getStatusIcon(b.status)}
                        <select
                          value={b.status}
                          onChange={(e) => updateStatus(b._id, e.target.value)}
                          className={`${styles.statusSelect} ${styles[b.status]}`}
                        >
                          {getStatusOptions(b.status).map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredBookings.length > itemsPerPage && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {Math.ceil(filteredBookings.length / itemsPerPage)}
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBookings.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredBookings.length / itemsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ManageBookings;