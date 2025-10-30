import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, CreditCard, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import styles from '../../styles/ManagePayments.module.css';

function ManagePayments() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Location filter states
  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch locations for filtering
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/locations/public', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err.message);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setPayments(data);
      setFilteredPayments(data);
    } catch (err) {
      console.error('Error fetching payments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, dateFrom, dateTo, selectedCity, selectedLocation, payments]);

  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(p =>
        new Date(p.createdAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(p =>
        new Date(p.createdAt) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Location filter
    if (selectedCity && !selectedLocation) {
      // Filter by city - extract city from location strings (format: "City - Location")
      filtered = filtered.filter(p => {
        const pickupCity = p.booking?.pickupLocation?.split(' - ')[0]?.toLowerCase();
        const dropCity = p.booking?.dropLocation?.split(' - ')[0]?.toLowerCase();
        return pickupCity === selectedCity.toLowerCase() || dropCity === selectedCity.toLowerCase();
      });
    } else if (selectedLocation) {
      // Filter by specific location - extract location name from location strings
      filtered = filtered.filter(p => {
        const pickupLocation = p.booking?.pickupLocation?.split(' - ')[1]?.toLowerCase();
        const dropLocation = p.booking?.dropLocation?.split(' - ')[1]?.toLowerCase();
        return pickupLocation === selectedLocation.toLowerCase() || dropLocation === selectedLocation.toLowerCase();
      });
    }

    setFilteredPayments(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSelectedCity('');
    setSelectedLocation('');
    setCurrentPage(1);
  };

  // Get unique cities for dropdown
  const uniqueCities = [...new Set(locations.map(loc => loc.city))].sort();

  // Get locations for selected city
  const cityLocations = locations.filter(loc => loc.city === selectedCity);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success':
        return <CheckCircle className="status-icon success" size={18} />;
      case 'failed':
        return <XCircle className="status-icon failed" size={18} />;
      case 'initiated':
        return <Clock className="status-icon initiated" size={18} />;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Customer', 'Amount', 'Method', 'Status', 'Transaction ID', 'Date'];
    const rows = filteredPayments.map(p => [
      p._id.slice(-6),
      p.customer?.name || '—',
      p.amount,
      p.method,
      p.status,
      p.transactionId || '—',
      new Date(p.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const successCount = filteredPayments.filter(p => p.status === 'success').length;
  const failedCount = filteredPayments.filter(p => p.status === 'failed').length;

  return (
    <div className={styles.paymentsContainer}>
      <div className={styles.paymentsHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Payment Transactions</h1>
          <p className={styles.pageSubtitle}>Manage and track all payment transactions</p>
        </div>
        <button className={styles.exportBtn} onClick={exportToCSV}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconTotal}>
            <CreditCard size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Transactions</p>
            <p className={styles.statValue}>{filteredPayments.length}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconSuccess}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Successful</p>
            <p className={styles.statValue}>{successCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconFailed}>
            <XCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Failed</p>
            <p className={styles.statValue}>{failedCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconAmount}>
            <CreditCard size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Amount</p>
            <p className={styles.statValue}>₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search by customer name, transaction ID..."
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
              <MapPin size={16} />
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedLocation(''); // Reset location when city changes
              }}
              className={styles.filterSelect}
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <MapPin size={16} />
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={styles.filterSelect}
              disabled={!selectedCity}
            >
              <option value="">All Locations</option>
              {cityLocations.map(location => (
                <option key={location._id} value={location.name}>{location.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <CreditCard size={16} />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="initiated">Initiated</option>
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
            <p>Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className={styles.emptyState}>
            <CreditCard size={48} />
            <p>No payments found</p>
            <span>Try adjusting your filters</span>
          </div>
        ) : (
          <table className={styles.paymentsTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((p) => (
                <tr key={p._id}>
                  <td className={styles.idCell}>{p._id.slice(-6)}</td>
                  <td className={styles.customerCell}>{p.customer?.name || '—'}</td>
                  <td className={styles.amountCell}>₹{p.amount?.toLocaleString()}</td>
                  <td>
                    <span className={styles.methodBadge}>{p.method}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`statusBadge${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`]}`}>
                      {getStatusIcon(p.status)}
                      {p.status}
                    </span>
                  </td>
                  <td className={styles.transactionCell}>{p.transactionId || '—'}</td>
                  <td className={styles.dateCell}>
                    {new Date(p.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredPayments.length > itemsPerPage && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {Math.ceil(filteredPayments.length / itemsPerPage)}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(filteredPayments.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ManagePayments;
